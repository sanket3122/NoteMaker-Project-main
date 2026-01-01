import React, { useState } from 'react';
import { SpeechClient } from '@google-cloud/speech';
import MicRecorder from 'mic-recorder-to-mp3';

const recorder = new MicRecorder({ bitRate: 128 });

const SpeechToText = () => {
  const [transcribedText, setTranscribedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    setIsRecording(true);
    try {
      await recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      const [buffer, blob] = await recorder.stop();
      const audioData = bufferToBase64(blob);
      transcribeAudio(audioData);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const transcribeAudio = async (audioData) => {
    const client = new SpeechClient();
    const audio = {
      content: audioData,
    };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
    };
    const request = {
      audio: audio,
      config: config,
    };

    try {
      const [response] = await client.recognize(request);
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join('\n');
      setTranscribedText(transcription);
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  const bufferToBase64 = (buffer) => {
    const blob = new Blob([buffer], { type: 'audio/mp3' });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]);
      };
    });
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <div>
        <h2>Transcribed Text:</h2>
        <p>{transcribedText}</p>
      </div>
    </div>
  );
};

export default SpeechToText;
