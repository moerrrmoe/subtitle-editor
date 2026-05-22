import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SubBlock = memo(
  ({ Index, subData, imageGpId, setTime, setSub, videoName }) => {
    const itemKey = useMemo(() => `${videoName}_${Index}`, [videoName, Index]);
    const [localSubtitle, setLocalSubtitle] = useState(subData.subtitle);
    const subDebounceTimer = useRef(null);
    const isMounted = useRef(true);
    const [imgUri, setImgUri] = useState(() => {
      return imageCache.current[itemKey]?.uri || "";
    });
    const [isImgLoading, setIsImgLoading] = useState(false);
    const [imgError, setImgError] = useState(() => {
      return imageCache.current[itemKey]?.error || false;
    });

    // Format time for display
    const formatTimeDisplay = useCallback((time) => {
      return `${String(time.hour).padStart(2, "0")}:${String(time.min).padStart(2, "0")}:${String(time.sec).padStart(2, "0")},${String(time.ms).padStart(3, "0")}`;
    }, []);

    const getImg = () => {
      setIsImgLoading(true);
      setImgError(false);
      if (imgUri) {
        setIsImgLoading(false);
        return;
      }

      if (!imageGpId) {
        setIsImgLoading(false);
        setImgError(true);
        return;
      }
      const startTime = `${String(subData.start.hour).padStart(1, "0")}_${String(subData.start.min).padStart(2, "0")}_${String(subData.start.sec).padStart(2, "0")}_${String(subData.start.ms).padStart(3, "0")}`;
      const endTime = `${String(subData.end.hour).padStart(1, "0")}_${String(subData.end.min).padStart(2, "0")}_${String(subData.end.sec).padStart(2, "0")}_${String(subData.end.ms).padStart(3, "0")}`;
      const partialName = `${startTime}__${endTime}`;
      setImgUri(
        `https://vip.yotepyaclub.com/sub-editor/extracted/${videoName}/${partialName}_${imageGpId}.jpeg`,
      );
      return null;
    };

    // Sync with props
    useEffect(() => {
      setLocalSubtitle(subData.subtitle);
    }, [subData.subtitle]);

    useEffect(() => {
      if (imageGpId) {
        getImg();
      }
    }, [imageGpId]);

    useEffect(() => {
      return () => {
        isMounted.current = false;
        if (subDebounceTimer.current) clearTimeout(subDebounceTimer.current);
      };
    }, []);

    useEffect(() => {
      if (imgUri) {
        imageCache.current[itemKey] = { uri: imgUri, error: imgError };
      }
    }, [imgUri, imgError, imageGpId, itemKey]);

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
        <View
          style={{
            flex: 1,
            overflowX: "scroll",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isImgLoading && (
            <ActivityIndicator
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
              }}
            />
          )}
          {imgUri && !imgError && (
            <Image
              source={{ uri: imgUri }}
              style={{
                width: 400,
                height: 80,
                marginTop: 8,
              }}
              onLoad={() => setIsImgLoading(false)}
              onError={() => {
                setIsImgLoading(false);
                setImgError(true);
              }}
            />
          )}
          {imgError && (
            <Text style={{ color: "red", marginTop: 8 }}>
              Failed to load image. If the issue persists, please contact
              developer(minn htet).
            </Text>
          )}
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

const imageCache = { current: {} };

export default SubBlock;
