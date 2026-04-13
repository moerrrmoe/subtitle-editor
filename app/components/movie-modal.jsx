import React from "react";
import { Button, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const MovieModal = ({ Id, Season, Ep, Submit, setId, setSeason, setEp }) => {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 10,
      }}
    >
      <TextInput
        value={Id}
        onChangeText={(newId) => setId(newId)}
        label="tmdb id"
      />
      <TextInput
        value={Season}
        onChangeText={(newSeason) => setSeason(newSeason)}
        label="season"
      />
      <TextInput
        value={Ep}
        onChangeText={(newEp) => setEp(newEp)}
        label="episode"
      />
      <Button
        style={{
          marginTop: 5,
        }}
        onPress={() => Submit()}
        mode="outlined"
      >
        Submit
      </Button>
    </SafeAreaView>
  );
};

export default MovieModal;
