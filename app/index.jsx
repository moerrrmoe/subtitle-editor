import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Appbar, Button, Divider } from "react-native-paper";

const Home = () => {
  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      router.push({
        pathname: "/editor",
        params: {
          file: uri,
        },
      });
    }
  }
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Appbar.Header>
        <Appbar.Content title="Home" />
      </Appbar.Header>
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 3,
            padding: 3,
          }}
        >
          <Button
            style={{
              width: 200,
            }}
            icon="camera"
            mode="contained"
            onPress={() => pickFile()}
          >
            Open Subtitle
          </Button>
        </View>
        <Divider></Divider>
        <ScrollView
          style={{
            flexDirection: "column",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              paddingLeft: 10,
            }}
            onPress={() =>
              router.push({
                pathname: "/editor",
                params: {
                  text: "Hello world",
                },
              })
            }
          >
            Edited Files
          </Text>
        </ScrollView>
      </View>
    </View>
  );
};

export default Home;
