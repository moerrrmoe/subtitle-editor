import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Button,
  MD2Colors,
  TextInput
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MovieModal from "./components/movie-modal";
import SubBlock from "./components/sub-block";

const Editor = () => {
  const webViewRef = useRef(null);
  const params = useLocalSearchParams();
  const [subArr, setSubArr] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [movieModalVisible, setMovieModalVisible] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [videoSeason, setVideoSeason] = useState("");
  const [videoEp, setVideoEp] = useState("");
  const [videoUrls, setVideoUrls] = useState([]);
  const [timeSyncModalVisible, setTimeSyncModalVisible] = useState(false);
  const [syncSecond, setSyncSecond] = useState(0);
  const [isWebviewVisible, setIsWebviewVisible] = useState(true);
  const [scrollIndex, setScrollIndex] = useState([]);
  const [imageGpId, setImageGpId] = useState(undefined);

  const flatListRef = useRef(null);
  const itemHeights = useRef({});
  const currentOffset = useRef(0);

  useEffect(() => {
    console.log("Editor mounted with params:", params);
  }, [params]);

  const strToTime = useCallback((str) => {
    const timearr = str.split(":");
    return {
      hour: Number(timearr[0]),
      min: Number(timearr[1]),
      sec:
        Number(timearr[2]?.split(timearr[2].includes(".") ? "." : ",")[0]) || 0,
      ms:
        Number(timearr[2]?.split(timearr[2].includes(".") ? "." : ",")[1]) || 0,
    };
  }, []);

  const TextToSub = useCallback(
    (text) => {
      const blocks = text.split(/(\n){2,}/);
      const tempSubArr = [];

      for (const block of blocks) {
        if (!block || block.trim() === "") continue;

        const lines = block.split("\n");
        let isValid = false;
        isValid =
          lines[0]?.trim() !== "" &&
          !isNaN(lines[0]) &&
          lines[1]?.includes("-->") &&
          lines[2] !== undefined;

        if (!isValid) {
          let vttValid = lines[0]?.includes("-->") && lines[1] !== undefined;
          if (vttValid) {
            const timeStrings = lines[0].split("-->");
            tempSubArr.push({
              start: strToTime(timeStrings[0].trim()),
              end: strToTime(timeStrings[1].trim()),
              subtitle: lines.slice(1).join("\n"),
              id: timeStrings[0].trim(),
            });
          }
        }

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

  useEffect(() => {
    console.log("video url updated:", videoUrls);
  }, [videoUrls]);

  useEffect(() => {
    if (params.fileName) {
      getImageGpId(params.fileName.replace(".vtt", ""));
    }
  }, [params.fileName]);

  const getImageGpId = useCallback((movieName) => {
    fetch(
      "https://vip.yotepyaclub.com/sub-editor/get_image_id.php?movie_name=" +
        encodeURIComponent(movieName),
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.ok == 1) {
          setImageGpId(data.image_id);
          console.log("Received image group ID:", data.image_id);
        } else {
          setImageGpId(null);
          alert(
            "Failed to get image group ID for " +
              movieName +
              "\nPlease connect to vpn and try again",
          );
        }
      });
  }, []);

  const saveAsVtt = () => {
    const vttText = ArrToSub(subArr);
    const fileName = params.fileName || "subtitle.vtt";
    const blob = new Blob([vttText], { type: "text/vtt" });

    // Check for msSaveBlob (works in some older/mini browsers)
    if (window.navigator && window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, fileName);
      Alert.alert("Subtitle saved");
      return;
    }

    // Regular download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    Alert.alert("Subtitle saved");
  };

  const testSubInVid = () => {
    if (videoUrls.length === 0) {
      Alert.alert("video not available. load it first");
      return;
    }

    const vttText = ArrToSub(subArr);
    fetch("https://vip.yotepyaclub.com/sub-editor/testsub.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vttText: vttText }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.output_url) {
          setVideoUrls((prev) =>
            prev.map(
              (url) =>
                url + "?sub_file=" + data.output_url + "&sub_label=Myanmar",
            ),
          );
        }
      })
      .catch((err) => {
        console.error("Error testing subtitle:", err);
        Alert.alert("Failed to test subtitle. Please try again.");
      });
  };

  const ArrToSub = (Arr) => {
    let vttText = "WEBVTT\n\n";
    Arr.forEach((block) => {
      const start =
        block.start.hour.toString().padStart(2, "0") +
        ":" +
        block.start.min.toString().padStart(2, "0") +
        ":" +
        block.start.sec.toString().padStart(2, "0") +
        "." +
        block.start.ms.toString().padStart(3, "0");
      const end =
        block.end.hour.toString().padStart(2, "0") +
        ":" +
        block.end.min.toString().padStart(2, "0") +
        ":" +
        block.end.sec.toString().padStart(2, "0") +
        "." +
        block.end.ms.toString().padStart(3, "0");
      const sub = block.subtitle;
      const subBlock = start + " --> " + end + "\n" + sub + "\n\n";
      vttText += subBlock;
    });
    return vttText;
  };

  const changeSub = useCallback((index, newSub) => {
    setSubArr((prevArr) => {
      if (!prevArr) return prevArr;
      if (prevArr[index]?.subtitle === newSub) return prevArr;
      const newArr = [...prevArr];
      newArr[index] = { ...newArr[index], subtitle: newSub };
      return newArr;
    });
  }, []);

  const syncTime = () => {
    setTimeSyncModalVisible(false);
    if (syncSecond === 0) {
      return;
    }
    setSubArr((prevSub) => {
      return prevSub.map((sub) => {
        // Convert start time to total seconds
        let startTotalSec =
          sub.start.hour * 3600 +
          sub.start.min * 60 +
          sub.start.sec +
          sub.start.ms / 1000;

        // Convert end time to total seconds
        let endTotalSec =
          sub.end.hour * 3600 +
          sub.end.min * 60 +
          sub.end.sec +
          sub.end.ms / 1000;

        // Add sync offset
        startTotalSec += syncSecond;
        endTotalSec += syncSecond;

        // Convert back to time components
        return {
          ...sub,
          start: {
            hour: Math.floor(startTotalSec / 3600),
            min: Math.floor((startTotalSec % 3600) / 60),
            sec: Math.floor(startTotalSec % 60),
            ms: Math.round((startTotalSec % 1) * 1000),
          },
          end: {
            hour: Math.floor(endTotalSec / 3600),
            min: Math.floor((endTotalSec % 3600) / 60),
            sec: Math.floor(endTotalSec % 60),
            ms: Math.round((endTotalSec % 1) * 1000),
          },
        };
      });
    });
  };

  const renderItems = useCallback(
    ({ item, index }) => {
      return (
        <SubBlock
          videoName={params.fileName.replace(".vtt", "")}
          subData={item}
          setSub={changeSub}
          Index={index}
          imageGpId={imageGpId}
        />
      );
    },
    [changeSub, params.fileName, imageGpId],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  // Optimized getItemLayout for better scrolling
  const getItemLayout = useCallback((data, index) => {
    const height = itemHeights.current[index] || 260; // Default height
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
      setVideoUrls(["https://vidlink.pro/movie/" + videoId]);
    } else if (isSeries) {
      setVideoUrls([
        `https://vidlink.pro/tv/${videoId}/${videoSeason}/${videoEp}`,
      ]);
    }

    setMovieModalVisible(false);
  }, [videoId, videoSeason, videoEp]);

  useEffect(() => {
    if (params.file) {
      loadSubtitleFile(params.file);
    }
  }, [params.file]);

  const loadSubtitleFile = async (fileUrl) => {
    setIsLoading(true);
    try {
      const response = await fetch(fileUrl);
      const text = await response.text();
      const parsedSubs = TextToSub(text.replace(/\r\n|\r/g, "\n"));
      setSubArr(parsedSubs || []);
    } catch (error) {
      console.error("Error loading subtitle file:", error);
      Alert.alert("Error", "Failed to load subtitle file");
    } finally {
      setIsLoading(false);
    }
  };

  // FlatList optimization props
  const flatListProps = useMemo(
    () => ({
      data: subArr,
      renderItem: renderItems,
      keyExtractor: keyExtractor,
      ref: flatListRef,
      // Performance optimizations
      initialNumToRender: 50,
      maxToRenderPerBatch: 50,
      removeClippedSubviews: Platform.OS !== "web", // Better performance on Android
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
      showsVerticalScrollIndicator: true,
      showsHorizontalScrollIndicator: false,
    }),
    [subArr, renderItems, keyExtractor, getItemLayout],
  );

  const ExpandCollapse = () => {
    if (isWebviewVisible && videoUrls.length > 0) {
      setIsWebviewVisible(false);
    } else {
      setIsWebviewVisible(true);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction
            onPress={() => {
              router.back();
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
            router.back();
          }}
        />
        <Appbar.Content title={params.fileName} />
        <Appbar.Action icon="content-save" onPress={() => saveAsVtt()} />
      </Appbar.Header>
      {videoUrls.length > 0 && (
        <View
          style={{
            minHeight: isWebviewVisible ? 300 : 0,
          }}
        >
          <iframe
            title="Video Player"
            src={videoUrls[0]}
            style={{
              width: "100%",
              height: videoUrls.length > 0 ? 300 : 0,
              border: "none",
            }}
            allowFullScreen
          />
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          style={styles.button}
          icon="movie-play-outline"
          mode="contained"
          onPress={() => setMovieModalVisible(true)}
        >
          Choose Movie
        </Button>
        <Button
          style={styles.button}
          mode="contained"
          onPress={() => setTimeSyncModalVisible(true)}
        >
          Time Sync
        </Button>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          style={styles.button}
          mode="contained"
          onPress={() => testSubInVid()}
        >
          Test Subtitle
        </Button>
        <Button
          style={styles.button}
          onPress={() => ExpandCollapse()}
          mode="contained"
        >
          Collapse/Expand
        </Button>
      </View>

      {imageGpId !== undefined && <FlatList {...flatListProps} />}

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

      <Modal
        visible={timeSyncModalVisible}
        onRequestClose={() => setTimeSyncModalVisible(false)}
        animationType="fade"
        style={{ flex: 1 }}
      >
        <SafeAreaView>
          <TextInput
            placeholder="total second to sync"
            keyboardType="numeric"
            onChangeText={(newSec) => setSyncSecond(Number(newSec))}
            style={{
              marginVertical: 10,
            }}
          />
          <Button
            mode="contained"
            onPress={() => {
              (syncTime(), setSyncSecond(0));
            }}
            style={{
              marginHorizontal: 10,
              marginBottom: 10,
            }}
          >
            commit sync
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              (setTimeSyncModalVisible(false), setSyncSecond(0));
            }}
            style={{
              marginHorizontal: 10,
            }}
          >
            Cancel
          </Button>
        </SafeAreaView>
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
    padding: 3,
    gap: 3,
    backgroundColor: "#fff",
  },
  button: {
    flex: 1 / 2,
  },
});

export default React.memo(Editor);
