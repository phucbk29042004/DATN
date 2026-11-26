import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

export default function SvgLineChart({
  data = [], // [{ label: '14:20', value: 12, value2: 2 }]
  valueKey = 'value',
  valueKey2 = null,
  color = '#0066cc',
  color2 = '#ef4444',
  height = 180,
  showThreshold = false,
  thresholdValue = 0.7,
  yDomain = null, // [min, max] or auto
  unit = '',
}) {
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 52; // Accounting for card paddings & margins

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Chưa có dữ liệu biểu đồ
        </Text>
      </View>
    );
  }

  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 26;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Calculate Max and Min
  const allValues = data.flatMap((d) => [
    d[valueKey] !== undefined ? d[valueKey] : 0,
    valueKey2 && d[valueKey2] !== undefined ? d[valueKey2] : 0,
    showThreshold ? thresholdValue : 0,
  ]);

  let minY = yDomain ? yDomain[0] : 0;
  let maxY = yDomain ? yDomain[1] : Math.max(...allValues, 1);
  if (maxY === minY) maxY = minY + 1;

  // Helper coordinate mapper
  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingTop + innerHeight - ((clamped - minY) / (maxY - minY)) * innerHeight;
  };

  // Build SVG Path string for line 1
  let pathD = '';
  let areaD = '';

  data.forEach((item, index) => {
    const x = getX(index);
    const y = getY(item[valueKey] || 0);

    if (index === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${paddingTop + innerHeight} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }
  });

  if (data.length > 0) {
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    areaD += ` L ${lastX} ${paddingTop + innerHeight} L ${firstX} ${paddingTop + innerHeight} Z`;
  }

  // Build SVG Path string for line 2 (optional)
  let pathD2 = '';
  if (valueKey2) {
    data.forEach((item, index) => {
      const x = getX(index);
      const y = getY(item[valueKey2] || 0);
      if (index === 0) {
        pathD2 = `M ${x} ${y}`;
      } else {
        pathD2 += ` L ${x} ${y}`;
      }
    });
  }

  // Y-axis ticks
  const yTicks = [
    { val: maxY, y: paddingTop },
    { val: (maxY + minY) / 2, y: paddingTop + innerHeight / 2 },
    { val: minY, y: paddingTop + innerHeight },
  ];

  // X-axis labels (up to 5 labels)
  const xStep = Math.max(1, Math.floor(data.length / 4));
  const xLabels = [];
  for (let i = 0; i < data.length; i += xStep) {
    xLabels.push({ index: i, text: data[i].label || `${i}` });
  }
  // Ensure last label is included
  if (data.length > 1 && xLabels[xLabels.length - 1]?.index !== data.length - 1) {
    xLabels.push({ index: data.length - 1, text: data[data.length - 1].label || '' });
  }

  const thresholdY = showThreshold ? getY(thresholdValue) : null;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* Horizontal Grid lines */}
        {yTicks.map((tick, i) => (
          <G key={`ytick-${i}`}>
            <Line
              x1={paddingLeft}
              y1={tick.y}
              x2={paddingLeft + innerWidth}
              y2={tick.y}
              stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <SvgText
              x={paddingLeft - 6}
              y={tick.y + 4}
              fontSize="10"
              fill={colors.textMuted || '#7a7a7a'}
              textAnchor="end"
              fontWeight="400"
            >
              {Number(tick.val).toFixed(maxY < 2 ? 1 : 0)}
              {unit}
            </SvgText>
          </G>
        ))}

        {/* Threshold Reference Line (if any) */}
        {thresholdY !== null && (
          <G>
            <Line
              x1={paddingLeft}
              y1={thresholdY}
              x2={paddingLeft + innerWidth}
              y2={thresholdY}
              stroke="#ef4444"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
            <SvgText
              x={paddingLeft + innerWidth - 4}
              y={thresholdY - 5}
              fontSize="9.5"
              fill="#ef4444"
              textAnchor="end"
              fontWeight="600"
            >
              Ngưỡng {thresholdValue}
            </SvgText>
          </G>
        )}

        {/* Flat Translucent Area Fill under Line 1 (No Gradient) */}
        {areaD ? <Path d={areaD} fill={color} fillOpacity={isDark ? 0.08 : 0.06} /> : null}

        {/* Primary Line */}
        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Secondary Line (if any) */}
        {pathD2 ? (
          <Path
            d={pathD2}
            fill="none"
            stroke={color2}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Points for line 1 */}
        {data.map((item, idx) => {
          const x = getX(idx);
          const y = getY(item[valueKey] || 0);
          return (
            <Circle
              key={`dot-${idx}`}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              stroke={colors.surface}
              strokeWidth="1.5"
            />
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((lbl, i) => (
          <SvgText
            key={`xlbl-${i}`}
            x={getX(lbl.index)}
            y={height - 6}
            fontSize="10"
            fill={colors.textMuted || '#7a7a7a'}
            textAnchor="middle"
            fontWeight="400"
          >
            {lbl.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
});

