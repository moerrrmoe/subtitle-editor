import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

const SubBlock = memo(
  ({ Index, subData, setTime, setSub }) => {
    const [localSubtitle, setLocalSubtitle] = useState(subData.subtitle);
    const subDebounceTimer = useRef(null);
    const isMounted = useRef(true);

    // Format time for display
    const formatTimeDisplay = useCallback((time) => {
      return `${String(time.hour).padStart(2, "0")}:${String(time.min).padStart(2, "0")}:${String(time.sec).padStart(2, "0")},${String(time.ms).padStart(3, "0")}`;
    }, []);

    // Sync with props
    useEffect(() => {
      setLocalSubtitle(subData.subtitle);
    }, [subData.subtitle]);

    useEffect(() => {
      return () => {
        isMounted.current = false;
        if (subDebounceTimer.current) clearTimeout(subDebounceTimer.current);
      };
    }, []);

    const handleSubtitleChange = useCallback(
      (text) => {
        setLocalSubtitle(text);

        if (subDebounceTimer.current) clearTimeout(subDebounceTimer.current);
        subDebounceTimer.current = setTimeout(() => {
          if (isMounted.current) {
            setSub(Index, text);
          }
        }, 500);
      },
      [Index, setSub],
    );

    return (
      <View style={styles.container}>
        {/* Time Display Row */}
        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeText}>
              {formatTimeDisplay(subData.start)}
            </Text>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeText}>
              {formatTimeDisplay(subData.end)}
            </Text>
          </View>
        </View>

        {/* Subtitle Text Input */}
        <View style={styles.subtitleContainer}>
          <TextInput
            style={styles.subtitleInput}
            multiline={true}
            numberOfLines={3}
            placeholder="Subtitle text"
            value={localSubtitle}
            onChangeText={handleSubtitleChange}
          />
        </View>

        <View style={styles.divider} />
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Fast comparison for performance
    return (
      prevProps.Index === nextProps.Index &&
      prevProps.subData.subtitle === nextProps.subData.subtitle &&
      prevProps.subData.start.hour === nextProps.subData.start.hour &&
      prevProps.subData.start.min === nextProps.subData.start.min &&
      prevProps.subData.start.sec === nextProps.subData.start.sec &&
      prevProps.subData.start.ms === nextProps.subData.start.ms &&
      prevProps.subData.end.hour === nextProps.subData.end.hour &&
      prevProps.subData.end.min === nextProps.subData.end.min &&
      prevProps.subData.end.sec === nextProps.subData.end.sec &&
      prevProps.subData.end.ms === nextProps.subData.end.ms
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  timeRow: {
    flexDirection: "row",
    marginBottom: 10,
    gap: 12,
  },
  timeBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  timeLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  timeText: {
    fontSize: 14,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "500",
  },
  subtitleContainer: {
    marginTop: 4,
  },
  subtitleInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  divider: {
    marginTop: 8,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
});

export default SubBlock;
