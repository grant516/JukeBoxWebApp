// https://www.youtube.com/watch?v=1PWDxgqLmDA
// For my own personal project, I may need to begin
// deveating from the video around the 21 min mark
// inside the video.

import config from "./config.json";
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, FormControl, Button, Row, Card } from 'react-bootstrap';
import { useState, useEffect } from 'react';

/*
Below here we are going to include all of the code that is needed to get the auth token
*/

async function authorize(){
  let url = "https://accounts.spotify.com/authorize";
  url += "?client_id=" + config.CLIENT_ID;
  url += "&response_type=code";
  url += "&redirect_uri=" + encodeURI(config.REDIRECT_URI);
  url += "&show_dialog=true";
  url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
  window.location.href = url; // Show Spotify's authorization screen
}
/*
End of the code for auth token
*/

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [queueAccessToken, setQueueAccessToken] = useState("");
  const [queueRefreshToken, setQueueRefreshToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [top10Tracks, setTopTracks] = useState([])

  useEffect(() => {
    // APIAcess Token
    var authParameters = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&client_id=' + config.CLIENT_ID + '&client_secret=' + config.CLIENT_SECRET + '&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private'
    }
    fetch('https://accounts.spotify.com/api/token', authParameters)
      .then(result => result.json())
      .then(data => setAccessToken(data.access_token))

      //console.log(accessToken);
      console.log("in here");
  }, [])

  // 
  //async function getAccessToken()
  const getAccessToken = async () =>
  {
    console.log("queueAccessToken: " + queueAccessToken);
    console.log("queueRefreshToken: " + queueRefreshToken);

    if (queueAccessToken.length <= 0 && queueRefreshToken.length <= 0)
    {
      let fullURL = window.location.href;
      let startIndex = fullURL.indexOf("code=");
      if(startIndex >= 0)
      {
        let code = fullURL.substring(startIndex + "code=".length);

        let scope = "user-read-private user-read-email user-modify-playback-state";
        var authOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=authorization_code&client_id=' + config.CLIENT_ID + '&client_secret=' + config.CLIENT_SECRET + '&code=' + code + '&redirect_uri=' + config.REDIRECT_URI + '&scope=' + scope
        }

        fetch('https://accounts.spotify.com/api/token', authOptions)
            .then(result => result.json())
            .then(result => {
              console.log(result); 
              setQueueRefreshToken(result.refresh_token); 
              setQueueAccessToken(result.access_token);
            })
            .catch(error => {
              // Handle any errors that occurred during the fetch or data processing
              console.error('Error:', error);
            });
        }
    }
  }

  async function addToQueue(songId) {
    //await getAccessToken();

    if(queueAccessToken.length > 0)
    {
      let options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${queueAccessToken}`
        }
      };

      let url = 'https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3A' + songId + '&device_id=' + config.DEVICE_ID_MY_COMP;

      console.log(url);

      fetch(url, options)
        .then(res => res.json())
        .then(json => console.log(json + "This is where I'm at"))
        .catch(err => console.error('error:' + err));
      // try {
      //   var authParameters = {
      //     // ?uri=${newQueue}&device_id=${playerState.config.DEVICE_ID_MY_COMP}
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${accessToken}`,
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       uri: songURI, // Provide the Spotify track URI here
      //       //device_id: "0e8a753c753d9cfe4926eb142358ca7e11de7dcf",
      //     }),
      //   };

      //   const response = await fetch('https://api.spotify.com/v1/me/player/queue?uri=' 
      //     + songURI + '&device_id=' + /*playerState.config.DEVICE_ID_MY_COMP*/"0e8a753c753d9cfe4926eb142358ca7e11de7dcf", authParameters);

      //   if (response.ok) {
      //     // Song added successfully
      //     console.log('Song added to queue!');
      //   } else {
      //     // Handle error if the song couldn't be added
      //     console.error('Failed to add song to queue');
      //   }
      // } catch (error) {
      //   console.error('Error adding song to queue:', error);
      // }
    }
  }


  // Search
  async function search() {
    //console.log("Searching for " + searchInput);

    // Get request using search to get the Artist ID
    var searchParameters = {
      methods: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }
    }

    var returnedSongs = await fetch('https://api.spotify.com/v1/search?q=' + searchInput + '&type=track' + '&market=US&limit=' + config.TOTAL_DISPLAYED_SONGS, searchParameters)
    .then(response => response.json())
    .then(data => {

      setTopTracks(data.tracks.items);
    })
  }

  const onClicked = async (song) => {
    await addToQueue(song.id);
  }

  // This function grabs the artist name(s) and prepares it before sending it 
  // to get it displayed.
  const artistName = (song) => {
    var songArtist = "";
    song.artists.map( (artist, i) => { 
      if(i > 0){
        songArtist += ", ";
      }
      songArtist += artist.name;
    })
    return songArtist;
  }

  return (
    <div className="App">
    <Button onClick={authorize}>
      Authorization
    </Button>
      <Container>
        <InputGroup className='mb-3' size="lg">
          <FormControl
          placeholder='Search For Songs'
          type="input"
          onKeyPress={event => {
            if (event.key === "Enter") {
              getAccessToken();
              search();
            }
          }}
          onChange={event => setSearchInput(event.target.value)}
          />
          <Button onClick={event => {
            getAccessToken();
            search();
          }}>
            Search
          </Button>
        </InputGroup>
      </Container>
      <Container>
        <Row className='mx-2 row row-cols-4'>
          {top10Tracks.map( (song, i) => {
            return (
              <Card onClick={() => onClicked(song)} style={{ cursor: "pointer" }}>
                <Card.Img src={song.album.images[0].url} />
                <Card.Body>
                  <Card.Title>{song.name}</Card.Title>  
                  <Card.Text>{artistName(song)}</Card.Text>
                </Card.Body> 
              </Card>
            )
          })}
        </Row>
        
      </Container>
    </div>
  );
}

export default App;
