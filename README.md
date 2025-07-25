# Scan For-Text 📷📝

Aplikacja webowa do rozpoznawania tekstu z kamery i zdjęć w czasie rzeczywistym, wykorzystująca Google Gemini AI.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)

## ✨ Funkcje

- 🔑 **Łatwa konfiguracja API** - Wbudowane pole do wprowadzania klucza Google Gemini
- 📹 **Dostęp do kamery** - Uruchamianie kamery z automatycznym wyborem tylnej kamery
- 📸 **Robienie zdjęć** - Zapis obrazów w wysokiej jakości
- 🔍 **OCR (Rozpoznawanie tekstu)** - Inteligentne rozpoznawanie tekstu z obrazów
- ⚡ **Skanowanie na żywo** - Rozpoznawanie tekstu w czasie rzeczywistym
- 🔄 **Zoom cyfrowy** - Kontrola przybliżenia kamery (jeśli obsługiwane)
- 📋 **Automatyczne wypełnianie** - Uzupełnianie formularzy na podstawie rozpoznanego tekstu
- 💾 **Eksport** - Kopiowanie i pobieranie rozpoznanego tekstu
- 📱 **Responsywny design** - Działanie na wszystkich urządzeniach
- 🌙 **Dark/Light mode** - Automatyczne dostosowanie do preferencji systemu

## 🚀 Szybki start

### 1. Pobranie projektu

```bash
git clone <repository-url>
cd cam
```

### 2. Konfiguracja API Google Gemini

Aby korzystać z funkcji rozpoznawania tekstu, potrzebujesz klucza API Google Gemini:

1. Przejdź do [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Utwórz nowy klucz API
3. Otwórz aplikację w przeglądarce
4. **Wprowadź klucz API bezpośrednio w interfejsie** - na górze strony znajdziesz pole do wpisania klucza
5. Kliknij "Zapisz" aby aktywować rozpoznawanie tekstu

> **Alternatywnie** możesz ustawić klucz przez konsolę przeglądarki (F12):
>
> ```javascript
> localStorage.setItem("GEMINI_API_KEY", "twój_klucz_api_tutaj");
> ```

### 3. Uruchomienie aplikacji

#### Opcja A: Python HTTP Server (zalecane)

```bash
python -m http.server 8000
```

#### Opcja B: Node.js HTTP Server

```bash
npx http-server -p 8000
```

#### Opcja C: PHP Built-in Server

```bash
php -S localhost:8000
```

Następnie otwórz przeglądarkę i przejdź do `http://localhost:8000`

## 📁 Struktura projektu

```
cam/
├── index.html          # Główny plik HTML
├── index.js            # Logika aplikacji (ES6 modules)
├── index.css           # Style CSS z obsługą dark/light mode
├── package-simple.json # Uproszczona konfiguracja projektu
└── README.md          # Dokumentacja
```

## 🎯 Instrukcja użytkowania

### Podstawowe funkcje:

1. **Uruchomienie kamery** - Kliknij przycisk "Camera" aby aktywować kamerę
2. **Robienie zdjęcia** - Kliknij "Foto" aby zrobić zdjęcie
3. **Rozpoznawanie tekstu** - Kliknij "Text view" aby rozpoznać tekst ze zdjęcia
4. **Skanowanie na żywo** - Kliknij "Scan Live" dla ciągłego rozpoznawania

### Zaawansowane funkcje:

- **Zoom** - Użyj suwaka zoom (jeśli kamera obsługuje)
- **Uzupełnianie formularzy** - Kliknij "Uzupełnij" aby automatycznie wypełnić pola
- **Export tekstu** - Użyj "Kopiuj" lub "Pobierz .txt"

## 🔧 Wymagania techniczne

- **Przeglądarka** z obsługą:
  - ES6 Modules
  - Camera API (getUserMedia)
  - Canvas API
  - Clipboard API
- **HTTPS** (wymagane dla dostępu do kamery)
- **Klucz API Google Gemini** (dla funkcji OCR)

## 🌐 Kompatybilność przeglądarek

| Przeglądarka | Wersja | Status            |
| ------------ | ------ | ----------------- |
| Chrome       | 90+    | ✅ Pełne wsparcie |
| Firefox      | 88+    | ✅ Pełne wsparcie |
| Safari       | 14+    | ✅ Pełne wsparcie |
| Edge         | 90+    | ✅ Pełne wsparcie |

## 🐛 Rozwiązywanie problemów

### Brak dostępu do kamery

- Sprawdź uprawnienia kamery w przeglądarce
- Upewnij się, że używasz HTTPS lub localhost
- Sprawdź czy kamera nie jest używana przez inną aplikację

### Błędy rozpoznawania tekstu

- Zweryfikuj poprawność klucza API Gemini
- Sprawdź połączenie internetowe
- Upewnij się, że obraz zawiera czytelny tekst

### Problemy z wydajnością

- Wyłącz skanowanie na żywo gdy nie jest potrzebne
- Użyj nowszej przeglądarki z lepszym wsparciem ES6
- Sprawdź czy masz wystarczającą prędkość internetu

## 🛡️ Bezpieczeństwo i prywatność

- **Lokalne przetwarzanie** - Zdjęcia są przetwarzane lokalnie w przeglądarce
- **Brak wysyłania danych** - Obrazy są wysyłane tylko do Google Gemini API dla OCR
- **Klucz API** - Przechowywany lokalnie w localStorage
- **Brak przechowywania** - Aplikacja nie zapisuje zdjęć ani tekstu na serwerze

## 📄 Licencja

MIT License - szczegóły w pliku `LICENSE`

## 🤝 Wkład w projekt

Zapraszamy do współpracy! Aby przyczynić się do rozwoju:

1. Forkuj repozytorium
2. Stwórz branch z funkcjonalnością (`git checkout -b feature/AmazingFeature`)
3. Zatwierdź zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Wypchnij do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

---

Stworzone z ❤️ dla potrzeb digitalizacji i automatyzacji procesów biznesowych.
