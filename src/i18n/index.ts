// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      landing: {
        title: "nOblivion",
        subtitle: "Precious memories persisted",
        description: "Preserve your family's life stories through meaningful conversations with our AI interviewer.",
        description_secondary: "Share memories, add photos, and create a lasting legacy for generations to come.",
        try_now: "Try it now",
        how_it_works: "How it works",
        backstory: {
          quote: "Walking along the shore, we often stumble upon empty seashells – silent echoes of the past.",
          paragraph1: "Their stories remain a mystery, lost to time, yet they spark our imagination. These shells, once vibrant and alive in a colorful underwater world, now stand as fragile reminders of something greater. They teach us an essential truth: preserving the stories of the past gives us the wisdom to live more fully in the present.",
          paragraph2: "Let us honor these tales, for in understanding where we come from, we shape a brighter, more meaningful today."
        },
        features: {
          create_profile: {
            title: "Create Profile",
            description: "Start by creating a profile with basic information about yourself or your loved one"
          },
          share_memories: {
            title: "Share Memories",
            description: "Engage in natural conversations with our AI interviewer to capture life stories"
          },
          preserve_legacy: {
            title: "Preserve Legacy",
            description: "Add photos, organize memories, and create a beautiful timeline of life events which can be printed as book from the PDF file we create for you!"
          }
        },
        cta: {
          title: "Gift yourself or a beloved one and start Preserving Your Memories Today",
          button: "Try it now"
        }
      },
      categories: {
        childhood: "Childhood",
        career: "Career",
        travel: "Travel",
        relationships: "Relationships",
        hobbies: "Hobbies",
        pets: "Pets",
      },
      memoryfilter: {
        year_range: "Year Range",
        year_filter: "Filter by year"
      },
      common: {
        error: "Error",
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel",
        back: "Back",
        next: "Next"
      },
      profile: {
        title: "Person Profile",
        steps: {
          basic_info: "Basic Information",
          characterization: "Characterization"
        },
        fields: {
          first_name: "First Name",
          last_name: "Last Name",
          dob: "Date of Birth",
          pob: "Place of Birth",
          gender: "Gender",
          add_child: "Add Child",
          add_language: "Add Spoken Language"
        },
        gender: {
          male: "Male",
          female: "Female",
          other: "Other"
        },
        backstory: {
          label: "Characterization",
          description: "Please provide a detailed description of the person in at least three sentences. Include significant life events, personality traits, and memorable characteristics.",
          placeholder: "Describe the person's life story, personality, and notable experiences..."
        },
        errors: {
          required_first_name: "First name is required",
          required_last_name: "Last name is required",
          required_dob: "Date of birth is required",
          required_pob: "Place of birth is required",
          required_gender: "Gender is required",
          required_image: "Profile image is required",
          required_backstory: "Please provide at least three sentences for characterization",
          invalid_image: "Please upload a valid image file",
          save_failed: "Failed to save profile"
        },
        continue_to_interview: "Continue to Interview"
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
        initial_question: "Tell me about a memorable moment from your life...",
        "tab_interview": "Our Interview",
        "tab_sessions": "Recent Sessions",
        "tab_tips": "Tips",
        "previous_sessions": "Previous Interview Sessions",
        "no_previous_sessions": "No previous sessions found.",
        "tips_title": "Tips for Better Memories",
        "tips_content": "Share specific details and emotions to make your memories more vivid."
      }
    }
  },
  de: {
    translation: {
      landing: {
        title: "nOblivion",
        subtitle: "Wertvolle Erinnerungen bewahren",
        description: "Bewahren Sie die Lebensgeschichten Ihrer Familie durch Gespräche mit unserem KI-Interviewer.",
        ds: "Teilen Sie Erinnerungen, fügen Sie Fotos hinzu und schaffen Sie ein bleibendes Vermächtnis für kommende Generationen.",
        try_now: "Jetzt ausprobieren",
        how_it_works: "So funktioniert's",
        backstory: {
          quote: "Am Strand finden wir oft leere Muscheln – stille Echos der Vergangenheit.",
          paragraph1: "Ihre Geschichten bleiben ein Geheimnis, verloren in der Zeit, und doch regen sie unsere Fantasie an. Diese Muscheln, einst lebendig in einer bunten Unterwasserwelt, stehen nun als zerbrechliche Erinnerungen an etwas Größeres. Sie lehren uns eine wesentliche Wahrheit: Das Bewahren der Geschichten der Vergangenheit gibt uns die Weisheit, intensiver in der Gegenwart zu leben.",
          paragraph2: "Lasst uns diese Geschichten ehren, denn das Verstehen unserer Herkunft hilft uns, ein helleres, bedeutungsvolleres Heute zu gestalten."
        },
        features: {
          create_profile: {
            title: "Profil erstellen",
            description: "Erstellen Sie ein Profil mit grundlegenden Informationen über sich oder Ihre Angehörigen"
          },
          share_memories: {
            title: "Erinnerungen teilen",
            description: "Führen Sie natürliche Gespräche mit unserem KI-Interviewer, um Lebensgeschichten festzuhalten"
          },
          preserve_legacy: {
            title: "Vermächtnis bewahren",
            description: "Fügen Sie Fotos hinzu, organisieren Sie Erinnerungen und erstellen Sie eine schöne Zeitleiste von Lebensereignissen, die als Buch aus der von uns erstellten PDF-Datei gedruckt werden kann!"
          }
        },
        cta: {
          title: "Schenken Sie sich oder einer geliebten Person die Chance, Ihre Erinnerungen zu bewahren",
          button: "Jetzt ausprobieren"
        }
      },
      categories: {
        childhood: "Kindheit",
        career: "Beruf",
        travel: "Reise",
        relationships: "Familie",
        hobbies: "Hobbys",
        pets: "Haustiere",
      },
      memoryfilter: {
        year_range: "Jahre einschränken",
        year_filter: "Nach Zeit filtern"
      },
      common: {
        error: "Fehler",
        loading: "Lädt...",
        save: "Speichern",
        cancel: "Abbrechen",
        back: "Zurück",
        next: "Weiter"
      },
      profile: {
        title: "Personenprofil",
        steps: {
          basic_info: "Grundinformationen",
          characterization: "Charakterisierung"
        },
        fields: {
          first_name: "Vorname",
          last_name: "Nachname",
          dob: "Geburtsdatum",
          pob: "Geburtsort",
          gender: "Geschlecht",
          add_child: "Kind hinzufügen",
          add_language: "Sprache hinzufügen"
        },
        gender: {
          male: "Männlich",
          female: "Weiblich",
          other: "Divers"
        },
        backstory: {
          label: "Charakterisierung",
          description: "Bitte beschreiben Sie die Person in mindestens drei Sätzen. Berücksichtigen Sie wichtige Lebensereignisse, Persönlichkeitsmerkmale und bemerkenswerte Eigenschaften.",
          placeholder: "Beschreiben Sie die Lebensgeschichte, Persönlichkeit und bemerkenswerte Erfahrungen der Person..."
        },
        errors: {
          required_first_name: "Vorname ist erforderlich",
          required_last_name: "Nachname ist erforderlich",
          required_dob: "Geburtsdatum ist erforderlich",
          required_pob: "Geburtsort ist erforderlich",
          required_gender: "Geschlecht ist erforderlich",
          required_image: "Profilbild ist erforderlich",
          required_backstory: "Bitte geben Sie mindestens drei Sätze für die Charakterisierung ein",
          invalid_image: "Bitte laden Sie eine gültige Bilddatei hoch",
          save_failed: "Profil konnte nicht gespeichert werden"
        },
        continue_to_interview: "Weiter zum Interview"
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
        take_photo: "Einen Schnappschuss aufnehmen",
        share_memory: "Teilen Sie Ihre Erinnerung...",
        drag_or_click: "Ziehen oder Klicken",
        add_images: "Hochladen", 
        use_camera: "Kamera",
        upload_images: "Bild(er) hochladen",
        transcribing: "Transkribiere",
        capture: "Foto aufnehmen",
        close_camera: "Kamera schließen",
        stop_recording: "Aufnahme beenden",
        save_memory: "Erinnerung speichern",
        upload_photo: "Foto hochladen",
        start_recording: "Diktieren",
        initial_question: "Erzählen Sie mir von einem unvergesslichen Moment in Ihrem Leben...",
        "tab_interview": "Unser Interview",
        "tab_sessions": "Letzte Sessions",
        "tab_tips": "Tipps",
        "previous_sessions": "Vorherige Interviewsitzungen",
        "no_previous_sessions": "Keine vorherigen Sitzungen gefunden.",
        "tips_title": "Tipps für bessere Erinnerungen",
        "tips_content": "Teilen Sie spezifische Details und Emotionen, um Ihre Erinnerungen lebendiger zu gestalten."
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
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    },
    defaultNS: 'translation'
  });

export default i18n;