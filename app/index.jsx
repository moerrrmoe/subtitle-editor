import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Appbar, Button, Divider } from "react-native-paper";

const Home = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem("history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const shareFile = async (uri) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];

        // Read the file content
        const fileContent = await FileSystem.readAsStringAsync(asset.uri);

        // Create filename with .vtt extension
        const vttFileName = asset.name.replace(/\.[^/.]+$/, "") + ".vtt";
        const permanentUri = `${FileSystem.documentDirectory}${vttFileName}`;

        // Write directly with .vtt extension
        await FileSystem.writeAsStringAsync(permanentUri, fileContent);

        const newItem = {
          name: vttFileName,
          uri: permanentUri,
          addedAt: new Date().toISOString(),
        };

        if (!history.find((item) => item.uri === newItem.uri)) {
          const newHistory = [newItem, ...history];
          setHistory(newHistory);
          await AsyncStorage.setItem("history", JSON.stringify(newHistory));
        } else {
          const existingIndex = history.findIndex(
            (item) => item.uri === newItem.uri,
          );
          if (existingIndex > -1) {
            const updatedHistory = [...history];
            updatedHistory.splice(existingIndex, 1);
            updatedHistory.unshift(newItem);
            setHistory(updatedHistory);
            await AsyncStorage.setItem(
              "history",
              JSON.stringify(updatedHistory),
            );
          }
        }

        router.push({
          pathname: "/editor",
          params: { file: permanentUri, fileName: vttFileName },
        });
      }
    } catch (error) {
      Alert.alert("File Error", "Could not copy the selected file.");
      console.error(error);
    }
  };

  const removeFromHistory = async (index) => {
    try {
      const item = history[index];

      // Clean up the file from disk
      const info = await FileSystem.getInfoAsync(item.uri);
      if (info.exists) {
        await FileSystem.deleteAsync(item.uri);
      }

      const updatedHistory = history.filter((_, i) => i !== index);
      setHistory(updatedHistory);
      await AsyncStorage.setItem("history", JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Remove error", e);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Sub Editor" />
      </Appbar.Header>

      <View style={styles.center}>
        <Button mode="contained" onPress={pickFile} icon="file-plus">
          Import Subtitle
        </Button>
      </View>

      <Divider />

      <ScrollView contentContainerStyle={styles.scroll}>
        {history.length === 0 ? (
          <Text style={styles.empty}>Your history is empty</Text>
        ) : (
          history.map((item, index) => (
            <View key={index} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text
                  style={styles.fileLink}
                  onPress={() =>
                    router.push({
                      pathname: "/editor",
                      params: { file: item.uri, fileName: item.name },
                    })
                  }
                >
                  {item.name}
                </Text>
              </View>
              <Button
                icon="delete-outline"
                onPress={() => removeFromHistory(index)}
              />
              <Button icon="share" onPress={() => shareFile(item.uri)} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { padding: 20, alignItems: "center" },
  scroll: { padding: 15 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  fileLink: { color: "#007AFF", fontSize: 16 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});

export default Home;
