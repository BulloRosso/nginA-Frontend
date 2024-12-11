// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        error: "Error",
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel"
      },
      profileSelection: {
        "title": "Select a Profile",
        "createNew": "Create New Profile",
        "or": "or continue with existing profile",
        "noProfiles": "No profiles found. Create a new one to get started.",
        "age": "Age",
        "lastInterview": "Last interview"
      },
      interview: {
        loading_question: "Loading question...",
        add_images: "Upload",
        use_camera: "Snapshot",
        drag_or_click: "Drag or click to select image(s)",
        share_memory: "Share your memory...",
        transcribing: "Transcribing",
        upload_images: "Upload image(s)",
        capture: "Capture Photo",
        close_camera: "Close Camera",
        stop_recording: "Stop Recording",
        save_memory: "Save Memory",
        upload_photo: "Upload Photo",
        start_recording: "Speak",
        initial_question: "Tell me about a memorable moment from your life..."
      }
    }
  },
  de: {
    translation: {
      common: {
        error: "Fehler",
        loading: "Lädt...",
        save: "Speichern",
        cancel: "Abbrechen"
      },
      profileSelection: {
        "title": "Bitte ein Profil auswählen",
        "createNew": "Neues Profil anlegen",
        "or": "oder mit einem existierenden Profil weitermachen",
        "noProfiles": "Es gibt noch keine Profile. Legen Sie ein Profil an, um zu starten.",
        "age": "Alter",
        "lastInterview": "Letztes Interview"
      },
      interview: {
        loading_question: "Lade Frage...",
        share_memory: "Teilen Sie Ihre Erinnerung...",
        drag_or_click: "Ziehen oder Klicken",
        add_images: "Bild(er) hinzufügen", 
        use_camera: "Kamera verwenden",
        upload_images: "Bild(er) hochladen",
        transcribing: "Transkribiere",
        capture: "Foto aufnehmen",
        close_camera: "Kamera schließen",
        stop_recording: "Aufnahme beenden",
        save_memory: "Erinnerung speichern",
        upload_photo: "Foto hochladen",
        start_recording: "Aufnahme starten",
        initial_question: "Erzählen Sie mir von einem unvergesslichen Moment in Ihrem Leben..."
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'de'],
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    defaultNS: 'translation'
  });

export default i18n;