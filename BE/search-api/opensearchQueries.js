import { opensearchClient } from '../storage/opensearch.js';

const INDEX_PATTERN = 'logs-*';

/**
 * Truy vấn log với bộ lọc đầy đủ: full-text, level, service, time range, pagination
 */
export async function searchLogs({ query, level, service, from, to, page, size }) {
  const from_offset = (page - 1) * size;

  const filters = [
    { range: { timestamp: { gte: from, lte: to } } }
  ];

  if (level) {
    filters.push({ term: { 'level.keyword': level } });
  }
  if (service) {
    filters.push({ term: { 'service_name.keyword': service } });
  }

  const mustClauses = query
    ? [{ match: { message: { query, operator: 'and' } } }]
    : [{ match_all: {} }];

  const body = {
    query: { bool: { must: mustClauses, filter: filters } },
    sort: [{ timestamp: { order: 'desc' } }],
    from: from_offset,
    size
  };

  try {
    const response = await opensearchClient.search({ index: INDEX_PATTERN, body });
    const hits = response.body.hits;
    return {
      total: hits.total.value,
      page,
      size,
      total_pages: Math.ceil(hits.total.value / size),
      logs: hits.hits.map(h => ({ id: h._id, ...h._source }))
    };
  } catch (error) {
    console.warn('[OpenSearch searchLogs Warning]:', error.message);
    return { total: 0, page: 1, size, total_pages: 0, logs: [] };
  }
}

/**
 * Thống kê số log theo level và danh sách services trong time window
 */
export async function getLogStats({ from, to }) {
  const body = {
    query: { range: { timestamp: { gte: from, lte: to } } },
    size: 0,
    aggs: {
      by_level: { terms: { field: 'level.keyword', size: 10 } },
      by_service: { terms: { field: 'service_name.keyword', size: 50 } },
      logs_over_time: {
        date_histogram: { field: 'timestamp', calendar_interval: 'minute' }
      }
    }
  };

  try {
    const response = await opensearchClient.search({ index: INDEX_PATTERN, body });
    const aggs = response.body.aggregations;
    return {
      time_range: { from, to },
      total: response.body.hits.total.value,
      by_level: aggs.by_level.buckets.map(b => ({ level: b.key, count: b.doc_count })),
      by_service: aggs.by_service.buckets.map(b => ({ service: b.key, count: b.doc_count })),
      over_time: aggs.logs_over_time.buckets.map(b => ({
        time: new Date(b.key_as_string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: b.key_as_string,
        logs: b.doc_count
      }))
    };
  } catch (error) {
    console.warn('[OpenSearch getLogStats Warning]:', error.message);
    return { time_range: { from, to }, total: 0, by_level: [], by_service: [], over_time: [] };
  }
}

/**
 * Lấy 4 KPI metrics cho Dashboard Overview:
 *   - total_logs_24h, anomaly_count_1h, template_count, avg_latency_ms
 */
export async function getKpiStats() {
  const now = new Date().toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Query 1: Tổng logs 24h + phân phối level
    const statsBody = {
      query: { range: { timestamp: { gte: twentyFourHoursAgo, lte: now } } },
      size: 0,
      aggs: {
        by_level: { terms: { field: 'level.keyword', size: 10 } },
        template_count: { cardinality: { field: 'drain_template_id.keyword' } }
      }
    };

    // Query 2: Số anomaly trong 1h
    const anomalyBody = {
      query: {
        bool: {
          filter: [
            { range: { timestamp: { gte: oneHourAgo, lte: now } } },
            { range: { anomaly_score: { gt: 0.7 } } }
          ]
        }
      },
      size: 0
    };

    const [statsResp, anomalyResp] = await Promise.all([
      opensearchClient.search({ index: INDEX_PATTERN, body: statsBody }).catch(() => ({ body: { hits: { total: { value: 0 } }, aggregations: { by_level: { buckets: [] }, template_count: { value: 0 } } } })),
      opensearchClient.search({ index: INDEX_PATTERN, body: anomalyBody }).catch(() => ({ body: { hits: { total: { value: 0 } } } }))
    ]);

    const aggs = statsResp.body.aggregations || {};
    const totalLogs = statsResp.body.hits?.total?.value || 0;
    const anomalyCount = anomalyResp.body.hits?.total?.value || 0;
    const templateCount = aggs.template_count?.value || 0;

    // Tính % FATAL alerts
    const fatalBucket = aggs.by_level?.buckets?.find(b => b.key === 'FATAL');
    const fatalCount = fatalBucket ? fatalBucket.doc_count : 0;

    return {
      total_logs_24h: totalLogs,
      anomaly_count_1h: anomalyCount,
      template_count: templateCount,
      fatal_count_1h: fatalCount,
      avg_latency_ms: null // Được tính từ pipeline benchmark, không có trong OpenSearch
    };
  } catch (error) {
    console.warn('[OpenSearch getKpiStats Warning]:', error.message);
    return {
      total_logs_24h: 0,
      anomaly_count_1h: 0,
      template_count: 0,
      fatal_count_1h: 0,
      avg_latency_ms: null
    };
  }
}

/**
 * Lấy danh sách anomaly events gần nhất (anomaly_score > threshold)
 */
export async function getRecentAnomalies({ from, to, threshold = 0.5, size = 50 }) {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { timestamp: { gte: from, lte: to } } },
          { range: { anomaly_score: { gte: threshold } } }
        ]
      }
    },
    sort: [
      { anomaly_score: { order: 'desc', unmapped_type: 'float' } },
      { timestamp: { order: 'desc', unmapped_type: 'date' } }
    ],
    size
  };

  try {
    const response = await opensearchClient.search({ index: INDEX_PATTERN, body });
    const hits = response.body.hits;
    return {
      total: hits.total.value,
      anomalies: hits.hits.map(h => ({ id: h._id, ...h._source }))
    };
  } catch (error) {
    console.warn('[OpenSearch getRecentAnomalies Warning]:', error.message);
    return { total: 0, anomalies: [] };
  }
}

/**
 * Lấy danh sách các Drain template đã được khai phá (distinct patterns)
 */
export async function getDrainTemplates({ size = 100 } = {}) {
  const body = {
    query: { exists: { field: 'drain_template' } },
    size: 0,
    aggs: {
      templates: {
        terms: {
          field: 'drain_template.keyword',
          size,
          order: { _count: 'desc' }
        },
        aggs: {
          example_id: { top_hits: { size: 1, _source: ['drain_template', 'drain_template_id', 'level', 'service_name'] } }
        }
      }
    }
  };

  try {
    const response = await opensearchClient.search({ index: INDEX_PATTERN, body });
    const buckets = response.body.aggregations?.templates?.buckets || [];
    return {
      total: buckets.length,
      templates: buckets.map((b, idx) => ({
        id: idx + 1,
        template: b.key,
        count: b.doc_count,
        template_id: b.example_id?.hits?.hits?.[0]?._source?.drain_template_id || `T${idx + 1}`,
        level: b.example_id?.hits?.hits?.[0]?._source?.level || 'INFO',
        service: b.example_id?.hits?.hits?.[0]?._source?.service_name || 'unknown'
      }))
    };
  } catch (error) {
    console.warn('[OpenSearch getDrainTemplates Warning]:', error.message);
    return { total: 0, templates: [] };
  }
}


/**
 * Truy vấn dữ liệu phân tích bất thường đa chiều (Anomaly Analytics Dashboard)
 * @param {Object} params - { from, to, service, level }
 * @returns {Object} Analytics data gồm: kpi, timeline, levelDistribution, topErrorServices, anomalyScores, heatmap, topTemplates
 */
export async function getAnomalyAnalytics({ from, to, service, level }) {
  // Build filter array
  const filters = [
    { range: { timestamp: { gte: from, lte: to } } }
  ];
  if (service) filters.push({ term: { 'service_name.keyword': service } });
  if (level) filters.push({ term: { 'level.keyword': level } });

  try {
    // Query 1: KPI + Timeline + Level Distribution + Top Services
    const mainBody = {
      query: { bool: { filter: filters } },
      size: 0,
      aggs: {
        total_logs: { value_count: { field: 'timestamp' } },
        error_count: {
          filter: { terms: { 'level.keyword': ['ERROR', 'FATAL'] } }
        },
        anomaly_count: {
          filter: { range: { anomaly_score: { gte: 0.7 } } }
        },
        timeline: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: 'minute'
          },
          aggs: {
            by_level: {
              terms: { field: 'level.keyword', size: 5 }
            },
            anomaly_markers: {
              filter: { range: { anomaly_score: { gte: 0.7 } } }
            }
          }
        },
        by_level: {
          terms: { field: 'level.keyword', size: 10 }
        },
        top_error_services: {
          filter: { terms: { 'level.keyword': ['ERROR', 'FATAL'] } },
          aggs: {
            services: {
              terms: { field: 'service_name.keyword', size: 10, order: { _count: 'desc' } }
            }
          }
        },
        heatmap: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: 'hour'
          },
          aggs: {
            error_count: {
              filter: { terms: { 'level.keyword': ['ERROR', 'FATAL'] } }
            }
          }
        },
        top_templates: {
          filter: { exists: { field: 'drain_template' } },
          aggs: {
            templates: {
              terms: { field: 'drain_template.keyword', size: 8, order: { _count: 'desc' } },
              aggs: {
                sample: { top_hits: { size: 1, _source: ['drain_template_id', 'level', 'service_name'] } }
              }
            }
          }
        }
      }
    };

    // Query 2: Anomaly score time series (chỉ lấy log có anomaly_score > 0)
    const scoreBody = {
      query: {
        bool: {
          filter: [
            ...filters,
            { range: { anomaly_score: { gt: 0 } } }
          ]
        }
      },
      size: 200,
      sort: [{ timestamp: { order: 'asc' } }],
      _source: ['timestamp', 'anomaly_score', 'service_name', 'level']
    };

    const [mainResp, scoreResp] = await Promise.all([
      opensearchClient.search({ index: INDEX_PATTERN, body: mainBody }).catch(() => null),
      opensearchClient.search({ index: INDEX_PATTERN, body: scoreBody }).catch(() => null)
    ]);

    // Parse main response
    const aggs = mainResp?.body?.aggregations || {};
    const totalLogs = mainResp?.body?.hits?.total?.value || 0;
    
    // KPI
    const errorCount = aggs.error_count?.doc_count || 0;
    const kpi = {
      total_logs: totalLogs,
      error_count: errorCount,
      error_fatal_count: errorCount,
      anomaly_count: aggs.anomaly_count?.doc_count || 0,
      throughput: totalLogs > 0 ? (() => {
        const fromMs = new Date(from).getTime();
        const toMs = new Date(to).getTime();
        const durationSec = Math.max((toMs - fromMs) / 1000, 1);
        return parseFloat((totalLogs / durationSec).toFixed(2));
      })() : 0
    };

    // Timeline (stacked by level with anomaly markers)
    const timeline = (aggs.timeline?.buckets || []).map(b => {
      const entry = {
        time: new Date(b.key_as_string).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: b.key_as_string,
        total: b.doc_count,
        anomaly_count: b.anomaly_markers?.doc_count || 0
      };
      (b.by_level?.buckets || []).forEach(lb => {
        entry[lb.key] = lb.doc_count;
      });
      return entry;
    });

    // Level Distribution
    const levelDistribution = (aggs.by_level?.buckets || []).map(b => ({
      name: b.key,
      value: b.doc_count
    }));

    // Top Error Services
    const topErrorServices = (aggs.top_error_services?.services?.buckets || []).map(b => ({
      service: b.key,
      count: b.doc_count
    }));

    // Anomaly Scores
    const anomalyScores = (scoreResp?.body?.hits?.hits || []).map(h => ({
      time: new Date(h._source.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: h._source.timestamp,
      score: h._source.anomaly_score,
      service: h._source.service_name,
      level: h._source.level
    }));

    // Heatmap: transform to hour-of-day × day-of-week
    const heatmapRaw = (aggs.heatmap?.buckets || []);
    const heatmap = heatmapRaw.map(b => {
      const d = new Date(b.key_as_string);
      const errCount = b.error_count?.doc_count || 0;
      return {
        day: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
        dayIndex: d.getDay(),
        hour: d.getHours(),
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        error_count: errCount,
        count: errCount,
        total: b.doc_count
      };
    });

    // Top Templates
    const topTemplates = (aggs.top_templates?.templates?.buckets || []).map((b, idx) => ({
      id: idx + 1,
      template: b.key,
      count: b.doc_count,
      template_id: b.sample?.hits?.hits?.[0]?._source?.drain_template_id || `T${idx + 1}`,
      level: b.sample?.hits?.hits?.[0]?._source?.level || 'INFO',
      service: b.sample?.hits?.hits?.[0]?._source?.service_name || 'unknown'
    }));

    return {
      kpi,
      timeline,
      levelDistribution,
      level_distribution: levelDistribution,
      topErrorServices,
      top_services: topErrorServices,
      anomalyScores,
      score_timeline: anomalyScores,
      heatmap,
      topTemplates,
      top_templates: topTemplates
    };
  } catch (error) {
    console.warn('[OpenSearch getAnomalyAnalytics Warning]:', error.message);
    return {
      kpi: { total_logs: 0, error_count: 0, error_fatal_count: 0, anomaly_count: 0, throughput: 0 },
      timeline: [],
      levelDistribution: [],
      level_distribution: [],
      topErrorServices: [],
      top_services: [],
      anomalyScores: [],
      score_timeline: [],
      heatmap: [],
      topTemplates: [],
      top_templates: []
    };
  }
}
