// src/components/utils/GoogleTranslate.jsx
import { useEffect } from "react"

const GoogleTranslate = () => {
  useEffect(() => {
    const loadGoogleTranslate = () => {
      if (document.getElementById("google-translate-script")) return // éviter doublons

      const script = document.createElement("script")
      script.id = "google-translate-script"
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      script.async = true
      document.body.appendChild(script)

      window.googleTranslateElementInit = () => {
        if (!document.getElementById("gt-widget-loaded")) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "fr",
              includedLanguages: "fr,en,ar,de,es,it,pt,ru,zh-CN,ja,ko,nl,tr,pl",
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            "google_translate_element"
          )
          const marker = document.createElement("div")
          marker.id = "gt-widget-loaded"
          document.body.appendChild(marker)
        }
      }
    }

    loadGoogleTranslate()
  }, [])

  return (
    <div className="translate-container">
      <div id="google_translate_element"></div>
    </div>
  )
}

export default GoogleTranslate