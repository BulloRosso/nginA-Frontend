// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      chat: {
        "listening": "Listening... Speak now",
          "speech_not_supported": "Speech recognition is not supported in your browser",
        chat_with: "Hi, I am",
        type_message: "Type your message here",
        welcome_message: "I can tell you about people I know and experiences from my past. Let's figure out blind spots in my memory together."
      },
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
      memory: {
        drop_here: "Drop the files here ...",
        drag_drop: "Drag 'n' drop some images here, or click to select files",
        selected_memory: "Add details to this memory",
        loading_timeline: "Preparing timeline...",
        selection_hint: "Tip: You can select a memory in the timeline to add further details to it. Just click the round icon button."
      },
      categories: {
        childhood: "Childhood",
        career: "Career",
        travel: "Travel",
        relationships: "Relationships",
        hobbies: "Hobbies",
        pets: "Pets",
      },
      buy: {
        checkout: "Proceed to Checkout",
        feature: "Feature",
        basic: "Free",
        premium: "Premium",
        category: { memories: "Memories", storage: "Images/Photos", export: "PDF creation", support: "Retention" } ,
        basic_memories: "up to 10",
        premium_memories: "up to 500",
        basic_exports: "2",
        premium_exports: "unlimited",
        basic_storage: "1 per memory",
        premium_storage: "10 per memory",
        basic_retention: "3 months",
        premium_retention: "unlimited",
        title: "Start saving memories now!",
        one_time_payment: "One-time payment",
      },
      memoryfilter: {
        drop_here: "Bild hier ablegen ...",
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
        chat: "Chat",
        buy: "Buy now!",
        currency: "US$",
        "delete_success": "Profile deleted successfully",
        "delete_error": "Error when trying to delete profile. Try again later.",
        "age": "Age",
        "total_sessions": "Total Sessions",
        "last_session": "Last Session",
        "create_book": "Create Book as PDF",
        "remove_profile": "Remove Profile",
        "confirm_delete": "Confirm Delete",
        "delete_warning": "Are you sure you want to delete this profile? This action cannot be undone.",
        "select_profile": "Create or select a person to be interviewed",
        "create_new": "Create New Profile",
        "or_continue": "or continue with existing profile",
        "sessions": "Sessions",
        "no_profiles": "No profiles found. Create a new one to get started.",
        title: "Describe the person to be interviewed",
        helpcation: "Our first step",
        help: `Before we begin the interview process, we need to understand more about you
          and your background. This information helps us create a more personalized
          and meaningful experience tailored specifically to your journey.`,
        help2: `If you are the person to be interviewed, please provide information about YOUR life - otherwise just describe the person you want to gift a nOblivion interview to.`,
        help3: 'You can manage more than one person (called profile) with you nOblivion.',
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
      menu: {
        home: "Home",
        profiles: "Profile Selection",
        logout: "Logout"
      },
      appbar: {
        sessionwith: "session with",
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
      chat: {
        "listening": "Ich höre... Sprechen Sie jetzt",
          "speech_not_supported": "Spracherkennung wird in Ihrem Browser nicht unterstützt",
        chat_with: "Hi, ich bin",
        type_message: "Tippe hier Deine Nachricht",
        welcome_message: "Frage mich zu Personen und Ereignissen aus meiner Vergangenheit! Lass uns zusammen herausfinden, wo ich noch Erinnerungslücken habe."
      },
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
        buy: {
          checkout: "Weiter zur Zahlung",
          title: "Jetzt kaufen und Erinnerungen bewahren",
          one_time_payment: "Einmal-Zahlung",
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
      menu: {
        "home": "Home",
        "profiles": "Profil auswählen",
        "logout": "Abmelden"
      },
      categories: {
        childhood: "Kindheit",
        career: "Beruf",
        travel: "Reise",
        relationships: "Familie",
        hobbies: "Hobbys",
        pets: "Haustiere",
      },
      memory: {
        drag_drop: "Bitte ziehen Sie ein JPG Bild hierher, oder klicken Sie um eine Datei auszuwählen",
        selected_memory: "Diese Erinnerung vertiefen",
        loading_timeline: "Bereite Zeitleiste vor...",
        selection_hint: "Tipp: Sie können eine Erinnerung vertiefen, indem Sie einfach auf den bunten Button in der Zeitleiste klicken."
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
        next: "Weiter",
        delete: "Löschen"
      },
      appbar: {
        sessionwith: "Session mit",
      },
      profile: {
        "chat": "Chat",     
        "currency": "€",  
        "buy": "Jetzt kaufen!",
        "delete_success": "Profil erfolgreich gelöscht",
        "delete_error": "Fehler beim Löschen des Profils. Bitte versuchen Sie es erneut.",
        "age": "Alter",
        "sessions": "Sitzungen",
        "total_sessions": "Sitzungen insg.",
        "last_session": "Letzte Sitzung",
        "create_book": "Erzeuge Buch als PDF",
        "remove_profile": "Entferne Profil",
        "confirm_delete": "Löschen bestätigen",
        "delete_warning": "Sind Sie sicher? Das Löschen kann nicht rückgängig gemacht werden.",
        "select_profile": "Eine Person für das Interview neu anlegen oder auswählen",
        "create_new": "Ein neues Profil erzeugen",
        "or_continue": "oder mit einem existierenden Profil fortfahren",
        "no_profiles": "Keine Profile vorhanden. Bitte erzeugen Sie ein neues Profil.",
        title: "Beschreibe die Person, mit der das Interview geführt wird",
        helpcaption:"Unser erster Schritt",
        help:`Bevor wir mit dem Interviewprozess beginnen, möchten wir mehr über Sie und Ihren Hintergrund erfahren. Diese Informationen helfen uns, eine individuellere und bedeutungsvollere Erfahrung zu schaffen, die speziell auf Ihr Umfeld abgestimmt ist.`,
        help2:`Wenn Sie die Person sind, die interviewt werden soll, geben Sie bitte Informationen über IHR Leben an – andernfalls beschreiben Sie einfach die Person, der Sie ein nOblivion-Interview schenken möchten.`,
        help3:'Sie können mehr als eine Person (auch Profil genannt) mit nOblivion verwalten.',
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