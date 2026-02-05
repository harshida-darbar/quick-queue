import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to Quick Queue",
      "login": "Login",
      "signup": "Sign Up",
      "navbar": {
        "myProfile": "My Profile",
        "myAppointments": "My Appointments",
        "logout": "Logout",
        "confirmLogout": "Confirm Logout",
        "logoutMessage": "Are you sure you want to logout?",
        "cancel": "Cancel"
      },
      "dashboard": {
        "availableServices": "Available Services",
        "myServices": "My Services",
        "createNewService": "Create New Service",
        "searchServices": "Search services...",
        "allServices": "All Services",
        "availableOnly": "Available Only"
      },
      "common": {
        "loading": "Loading..."
      }
    }
  },
  hi: {
    translation: {
      "welcome": "क्विक क्यू में आपका स्वागत है",
      "login": "लॉगिन",
      "signup": "साइन अप",
      "navbar": {
        "myProfile": "मेरी प्रोफ़ाइल",
        "myAppointments": "मेरी अपॉइंटमेंट्स",
        "logout": "लॉगआउट",
        "confirmLogout": "लॉगआउट की पुष्टि करें",
        "logoutMessage": "क्या आप वाकई लॉगआउट करना चाहते हैं?",
        "cancel": "रद्द करें"
      },
      "dashboard": {
        "availableServices": "उपलब्ध सेवाएं",
        "myServices": "मेरी सेवाएं",
        "createNewService": "नई सेवा बनाएं",
        "searchServices": "सेवाएं खोजें...",
        "allServices": "सभी सेवाएं",
        "availableOnly": "केवल उपलब्ध",
        "available" : "उपलब्ध",
      },
      "common": {
        "loading": "लोड हो रहा है..."
      }
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;