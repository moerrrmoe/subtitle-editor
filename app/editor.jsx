import * as FileSystem from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlatList, Modal, Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-interception-webview";
import {
  ActivityIndicator,
  Appbar,
  Button,
  MD2Colors,
} from "react-native-paper";
import MovieModal from "./components/movie-modal";
import SubBlock from "./components/sub-block";

const Editor = () => {
  const params = useLocalSearchParams();
  const [fileUri, setFileUri] = useState(null);
  const [subArr, setSubArr] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [movieModalVisible, setMovieModalVisible] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [videoSeason, setVideoSeason] = useState("");
  const [videoEp, setVideoEp] = useState("");
  const [videoUrls, setVideoUrls] = useState([]);

  const flatListRef = useRef(null);
  const itemHeights = useRef({});

  const strToTime = useCallback((str) => {
    const timearr = str.split(":");
    return {
      hour: timearr[0],
      min: timearr[1],
      sec: timearr[2]?.split(",")[0] || "0",
      ms: timearr[2]?.split(",")[1] || "0",
    };
  }, []);

  const TextToSub = useCallback(
    (text) => {
      const blocks = text.split(/(\n){2,}/);
      const tempSubArr = [];

      for (const block of blocks) {
        if (!block || block.trim() === "") continue;

        const lines = block.split("\n");
        const isValid =
          lines[0]?.trim() !== "" &&
          !isNaN(lines[0]) &&
          lines[1]?.includes("-->") &&
          lines[2] !== undefined;

        if (isValid) {
          const timeStrings = lines[1].split("-->");
          tempSubArr.push({
            start: strToTime(timeStrings[0].trim()),
            end: strToTime(timeStrings[1].trim()),
            subtitle: lines.slice(2).join("\n"),
            id: timeStrings[0].trim(),
          });
        }
      }

      return tempSubArr;
    },
    [strToTime],
  );

  const changeSub = useCallback((index, newSub) => {
    setSubArr((prevArr) => {
      if (!prevArr) return prevArr;
      if (prevArr[index]?.subtitle === newSub) return prevArr;
      const newArr = [...prevArr];
      newArr[index] = { ...newArr[index], subtitle: newSub };
      return newArr;
    });
  }, []);

  const renderItems = useCallback(
    ({ item, index }) => {
      return <SubBlock subData={item} setSub={changeSub} Index={index} />;
    },
    [changeSub],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // Optimized getItemLayout for better scrolling
  const getItemLayout = useCallback((data, index) => {
    const height = itemHeights.current[index] || 140; // Default height
    return {
      length: height,
      offset: height * index,
      index,
    };
  }, []);

  const onItemLayout = useCallback((index, height) => {
    if (itemHeights.current[index] !== height) {
      itemHeights.current[index] = height;
    }
  }, []);

  const MovieIdSubmitHandler = useCallback(() => {
    const isMovie =
      videoId.trim() !== "" &&
      videoSeason.trim() === "" &&
      videoEp.trim() === "";
    const isSeries =
      videoId.trim() !== "" &&
      videoSeason.trim() !== "" &&
      videoEp.trim() !== "";

    if (isMovie) {
      setVideoUrls(["https://vsembed.ru/embed/movie/" + videoId]);
    } else if (isSeries) {
      setVideoUrls([
        `https://vidsrc-embed.ru/embed/tv/${videoId}/${videoSeason}-${videoEp}`,
      ]);
    }

    setMovieModalVisible(false);
  }, [videoId, videoSeason, videoEp]);

  const renderWebview = useCallback(() => {
    if (Platform.OS === "web" && videoUrls.length > 0) {
      return (
        <iframe
          style={{
            height: "40vh",
            width: "100%",
            border: "none",
          }}
          title="video-player"
          src={videoUrls[0]}
          loading="lazy"
        />
      );
    } else if (Platform.OS === "android" && videoUrls.length > 0) {
      return (
        <WebView
          style={{
            flex: 1,
          }}
          source={{ uri: "https://dailymotion.com" }}
        />
      );
    }
    return null;
  }, [videoUrls]);

  useEffect(() => {
    if (params.file) {
      setFileUri(params.file);
    }
  }, [params.file]);

  useEffect(() => {
    if (!fileUri) return;

    let isMounted = true;

    const fetchText = async () => {
      try {
        let text;

        if (Platform.OS === "web") {
          const res = await fetch(fileUri);
          text = await res.text();
        } else {
          const file = new FileSystem.File(fileUri);
          text = await file.text();
        }

        if (isMounted && text) {
          const parsedSubs = TextToSub(text.replace(/\r\n|\r/g, "\n"));
          setSubArr(parsedSubs || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading subtitle file:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    fetchText();

    return () => {
      isMounted = false;
    };
  }, [fileUri, TextToSub]);

  // FlatList optimization props
  const flatListProps = useMemo(
    () => ({
      data: subArr,
      renderItem: renderItems,
      keyExtractor: keyExtractor,
      ref: flatListRef,
      // Performance optimizations
      initialNumToRender: 10,
      maxToRenderPerBatch: 5,
      windowSize: 7,
      updateCellsBatchingPeriod: 50,
      removeClippedSubviews: Platform.OS !== "web",
      // Layout optimization
      getItemLayout: getItemLayout,
      // Scroll performance
      decelerationRate: Platform.OS === "ios" ? 0.998 : 0.99,
      scrollEventThrottle: 16,
      // Maintain visible position
      maintainVisibleContentPosition:
        Platform.OS === "android"
          ? {
              minIndexForVisible: 0,
            }
          : undefined,
      // Disable virtualization for web
      disableVirtualization: Platform.OS === "web",
      // Optimize for large lists
      onEndReachedThreshold: 0.5,
      // Remove heavy features
      showsVerticalScrollIndicator: true,
      showsHorizontalScrollIndicator: false,
    }),
    [subArr, renderItems, keyExtractor, getItemLayout],
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction
            onPress={() => {
              /* Add navigation back */
            }}
          />
          <Appbar.Content title="Editor" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            animating={true}
            color={MD2Colors.blueA200}
            size="large"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction
          onPress={() => {
            /* Add navigation back */
          }}
        />
        <Appbar.Content title="Editor" />
      </Appbar.Header>

      {videoUrls.length > 0 && renderWebview()}

      <View style={styles.buttonContainer}>
        <Button
          style={styles.button}
          icon="movie-play-outline"
          mode="contained"
          onPress={() => setMovieModalVisible(true)}
        >
          Choose Movie
        </Button>
      </View>

      <FlatList {...flatListProps} />

      <Modal
        visible={movieModalVisible}
        onRequestClose={() => setMovieModalVisible(false)}
        animationType="slide"
      >
        <MovieModal
          Submit={MovieIdSubmitHandler}
          Id={videoId}
          setId={setVideoId}
          Season={videoSeason}
          setSeason={setVideoSeason}
          Ep={videoEp}
          setEp={setVideoEp}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 8,
    gap: 8,
    backgroundColor: "#fff",
  },
  button: {
    flex: 1,
  },
});

export default React.memo(Editor);
