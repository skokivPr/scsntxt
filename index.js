// Importy
import { GoogleGenAI } from "@google/genai";

// Elementy DOM
const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const photoResultElement = document.getElementById('photo-result');
const toggleCameraBtn = document.getElementById('toggle-camera-btn');
const takePhotoBtn = document.getElementById('take-photo');
const downloadPhotoLink = document.getElementById('download-photo');
const snapSound = document.getElementById('snap-sound');
const placeholder = document.getElementById('placeholder');
const photoContainer = document.getElementById('photo-container');
const photoPlaceholder = document.getElementById('photo-placeholder');
const errorMessageDiv = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Elementy DOM dla OCR
const recognizeTextBtn = document.getElementById('recognize-text');
const copyTextBtn = document.getElementById('copy-text');
const downloadTextBtn = document.getElementById('download-text-btn');
const fillFormBtn = document.getElementById('fill-form-btn');
const recognizedTextElement = document.getElementById('recognized-text');
const ocrLoadingIndicator = document.getElementById('ocr-loading-indicator');
const ocrResultContainer = document.getElementById('ocr-result-container');
const tractorInput = document.getElementById('tractor-input');
const trailerInput = document.getElementById('trailer-input');

// Elementy DOM dla skanowania ciągłego
const startRealTimeScanBtn = document.getElementById('start-real-time-scan');
const realTimeScanStatusElement = document.getElementById('real-time-scan-status');
const scannerOverlayElement = document.getElementById('scanner-overlay');
const realTimeTextOverlay = document.getElementById('real-time-text-overlay');

// Elementy DOM dla Zoom
const zoomControls = document.getElementById('zoom-controls');
const zoomSlider = document.getElementById('zoom-slider');
const zoomValueLabel = document.getElementById('zoom-value');

// Elementy DOM dla API konfiguracji
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key');
const toggleApiVisibilityBtn = document.getElementById('toggle-api-visibility');
const apiStatus = document.getElementById('api-status');
const toggleApiSectionBtn = document.getElementById('toggle-api-section');
const apiContent = document.getElementById('api-content');

let stream = null;
let videoTrack = null;
let ai = null;

// Stany dla skanowania ciągłego
let isRealTimeScanningActive = false;
let realTimeScanIntervalId = null;
let isProcessingFrame = false;
const REAL_TIME_SCAN_INTERVAL_MS = 2000;

// Stan audio
let audioInitialized = false;

// Funkcje zarządzania API key
function updateApiStatus(isConnected, message) {
    if (!apiStatus) return;

    apiStatus.className = `api-status ${isConnected ? 'success' : 'error'}`;
    const icon = apiStatus.querySelector('i');
    const span = apiStatus.querySelector('span');

    if (icon && span) {
        icon.className = `fas ${isConnected ? 'fa-check-circle' : 'fa-exclamation-triangle'}`;
        span.textContent = message;
    }

    // Automatycznie zwiń sekcję API gdy połączenie jest udane (ale tylko jeśli była rozwinięta)
    if (isConnected && apiContent && toggleApiSectionBtn) {
        setTimeout(() => {
            if (!apiContent.classList.contains('collapsed')) {
                apiContent.classList.add('collapsed');
                toggleApiSectionBtn.classList.add('collapsed');
                toggleApiSectionBtn.title = 'Pokaż konfigurację API';
            }
        }, 2000); // Opóźnienie 2 sekund po pokazaniu sukcesu
    }

    // Automatycznie rozwiń sekcję API gdy jest błąd
    if (!isConnected && apiContent && toggleApiSectionBtn) {
        if (apiContent.classList.contains('collapsed')) {
            apiContent.classList.remove('collapsed');
            toggleApiSectionBtn.classList.remove('collapsed');
            toggleApiSectionBtn.title = 'Ukryj konfigurację API';
        }
    }
}

function getApiKey() {
    // Sprawdź najpierw input pole, potem localStorage
    const inputKey = apiKeyInput?.value.trim();
    const storageKey = localStorage.getItem('GEMINI_API_KEY');
    return inputKey || storageKey || '';
}

function saveApiKey() {
    const apiKey = apiKeyInput?.value.trim();
    if (!apiKey) {
        showError('Wprowadź klucz API przed zapisaniem.');
        return false;
    }

    try {
        localStorage.setItem('GEMINI_API_KEY', apiKey);
        updateApiStatus(true, 'Klucz API zapisany pomyślnie');
        initializeGeminiAI();

        // Pokaż komunikat sukcesu na przycisku
        if (saveApiKeyBtn) {
            const originalHTML = saveApiKeyBtn.innerHTML;
            saveApiKeyBtn.innerHTML = '<i class="fas fa-check"></i> Zapisano!';
            saveApiKeyBtn.disabled = true;
            setTimeout(() => {
                saveApiKeyBtn.innerHTML = originalHTML;
                saveApiKeyBtn.disabled = false;
            }, 2000);
        }

        hideError();
        return true;
    } catch (error) {
        showError('Nie udało się zapisać klucza API.');
        return false;
    }
}

function loadApiKey() {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey && apiKeyInput) {
        apiKeyInput.value = savedKey;
    }
}

function initializeGeminiAI() {
    const apiKey = getApiKey();

    if (!apiKey) {
        ai = null;
        updateApiStatus(false, 'Wymagany klucz API Google Gemini');
        updateCameraUI(!!stream);
        updateOcrUI(!!photoResultElement?.src);
        return false;
    }

    try {
        ai = new GoogleGenAI({ apiKey: apiKey });
        updateApiStatus(true, 'Połączono z Google Gemini AI');
        updateCameraUI(!!stream);
        updateOcrUI(!!photoResultElement?.src);
        return true;
    } catch (e) {
        console.error("Błąd inicjalizacji GoogleGenAI:", e);
        ai = null;
        updateApiStatus(false, `Błąd inicjalizacji: ${e.message}`);
        updateCameraUI(!!stream);
        updateOcrUI(!!photoResultElement?.src);
        return false;
    }
}

function showError(message) {
    if (errorText && errorMessageDiv) {
        errorText.textContent = message;
        errorMessageDiv.classList.remove('hidden');
        errorMessageDiv.setAttribute('aria-live', 'assertive');
    }
    console.error("Error shown to user:", message);
}

function hideError() {
    if (errorMessageDiv) {
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.removeAttribute('aria-live');
        if (errorText) errorText.textContent = '';
    }
}

function updateCameraUI(isCameraOn) {
    if (toggleCameraBtn) {
        if (isCameraOn) {
            toggleCameraBtn.innerHTML = `<i class="fas fa-stop"></i> <span class="btn-text">Off</span>`;
            toggleCameraBtn.ariaLabel = "Zatrzymaj Kamerę";
            toggleCameraBtn.classList.remove('btn-primary');
            toggleCameraBtn.classList.add('btn-secondary');
        } else {
            toggleCameraBtn.innerHTML = `<i class="fas fa-camera"></i> <span class="btn-text">Camera</span>`;
            toggleCameraBtn.ariaLabel = "Uruchom Kamerę";
            toggleCameraBtn.classList.remove('btn-secondary');
            toggleCameraBtn.classList.add('btn-primary');
        }
        toggleCameraBtn.disabled = false;
    }

    if (takePhotoBtn) takePhotoBtn.disabled = !isCameraOn || isRealTimeScanningActive;

    if (startRealTimeScanBtn) {
        startRealTimeScanBtn.disabled = !isCameraOn || !ai || isRealTimeScanningActive;
        if (!ai && isCameraOn) {
            startRealTimeScanBtn.title = "Usługa rozpoznawania tekstu jest niedostępna.";
        } else if (!isCameraOn) {
            startRealTimeScanBtn.title = "Najpierw uruchom kamerę.";
        } else if (isRealTimeScanningActive) {
            startRealTimeScanBtn.title = "Skanowanie ciągłe jest aktywne.";
        } else {
            startRealTimeScanBtn.title = "Rozpocznij skanowanie ciągłe.";
        }
    }

    if (webcamElement && placeholder) {
        if (isCameraOn) {
            webcamElement.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            webcamElement.style.display = 'none';
            placeholder.style.display = 'flex';
            if (scannerOverlayElement) scannerOverlayElement.classList.add('hidden');
            if (realTimeTextOverlay) realTimeTextOverlay.classList.add('hidden');
            if (zoomControls) zoomControls.classList.add('hidden');
        }
    }
}

function updateOcrUI(photoAvailable, textRecognized = false, singleShotRecognitionInProgress = false) {
    if (recognizeTextBtn) {
        recognizeTextBtn.disabled = !photoAvailable || singleShotRecognitionInProgress || !ai || isRealTimeScanningActive;
        if (!ai && photoAvailable && !isRealTimeScanningActive) {
            recognizeTextBtn.title = "Usługa rozpoznawania tekstu jest niedostępna.";
        } else if (!photoAvailable && !isRealTimeScanningActive) {
            recognizeTextBtn.title = "Najpierw zrób zdjęcie.";
        } else if (isRealTimeScanningActive) {
            recognizeTextBtn.title = "Zatrzymaj skanowanie ciągłe, aby rozpoznać tekst ze zdjęcia.";
        } else {
            recognizeTextBtn.title = "Rozpoznaj tekst ze zrobionego zdjęcia.";
        }
    }

    const hasContent = recognizedTextElement && recognizedTextElement.value.trim() !== '';

    if (copyTextBtn) copyTextBtn.disabled = !hasContent || singleShotRecognitionInProgress || isProcessingFrame;
    if (downloadTextBtn) downloadTextBtn.disabled = !hasContent || singleShotRecognitionInProgress || isProcessingFrame;
    if (fillFormBtn) fillFormBtn.disabled = !hasContent || singleShotRecognitionInProgress || isProcessingFrame;

    if (ocrLoadingIndicator) {
        ocrLoadingIndicator.classList.toggle('hidden', !singleShotRecognitionInProgress);
    }

    if (realTimeScanStatusElement) {
        realTimeScanStatusElement.classList.toggle('hidden', !isRealTimeScanningActive || isProcessingFrame);
        if (isRealTimeScanningActive && !isProcessingFrame) realTimeScanStatusElement.textContent = "Skanowanie w toku...";
        else if (isRealTimeScanningActive && isProcessingFrame) realTimeScanStatusElement.textContent = "Przetwarzanie klatki...";
    }

    if (ocrResultContainer) {
        const shouldShowOcrContainer = photoAvailable || textRecognized || isRealTimeScanningActive || singleShotRecognitionInProgress || hasContent;
        ocrResultContainer.classList.toggle('hidden', !shouldShowOcrContainer);
    }

    if (!photoAvailable && !isRealTimeScanningActive && !singleShotRecognitionInProgress && !textRecognized) {
        if (recognizedTextElement) recognizedTextElement.value = '';
        if (ocrResultContainer) ocrResultContainer.classList.add('hidden');
    }
}

async function startCamera() {
    hideError();
    if (isRealTimeScanningActive) await stopRealTimeScanning();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
                    console.warn("Tylna kamera nie jest dostępna lub nie spełnia wymagań, próba z domyślną kamerą.");
                    delete constraints.video.facingMode;
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } else {
                    throw err;
                }
            }

            // Obsługa kontrolek zoomu
            videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const capabilities = videoTrack.getCapabilities();
                if (zoomSlider && zoomControls && zoomValueLabel && capabilities.zoom) {
                    zoomControls.classList.remove('hidden');
                    zoomSlider.min = capabilities.zoom.min.toString();
                    zoomSlider.max = capabilities.zoom.max.toString();
                    zoomSlider.step = capabilities.zoom.step.toString();
                    const currentZoom = videoTrack.getSettings().zoom || capabilities.zoom.min;
                    zoomSlider.value = currentZoom.toString();
                    zoomValueLabel.textContent = `${parseFloat(zoomSlider.value).toFixed(1)}x`;
                } else {
                    if (zoomControls) zoomControls.classList.add('hidden');
                }
            }

            if (webcamElement) {
                webcamElement.srcObject = stream;
                webcamElement.onloadedmetadata = () => {
                    updateCameraUI(true);
                    updateOcrUI(!!photoResultElement?.src);
                };
            } else {
                updateCameraUI(true);
                updateOcrUI(!!photoResultElement?.src);
            }
        } catch (err) {
            console.error("Błąd podczas dostępu do kamery: ", err);
            let userMessage = "Nie można uzyskać dostępu do kamery. ";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                userMessage += "Odmówiono pozwolenia na dostęp do kamery. Sprawdź ustawienia uprawnień kamery dla tej strony w swojej przeglądarce.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                userMessage += "Nie znaleziono żadnej kamery. Upewnij się, że urządzenie ma podłączoną i działającą kamerę.";
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                userMessage += "Nie można odczytać strumienia z kamery. Może być używana przez inną aplikację lub wystąpił problem sprzętowy.";
            } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError") {
                userMessage += "Żądane parametry kamery (np. rozdzielczość) nie mogą być spełnione przez dostępne urządzenia.";
            } else if (err.name === "TypeError") {
                userMessage += "Błąd konfiguracji kamery. Możliwe, że przeglądarka nie obsługuje tych ustawień.";
            } else {
                userMessage += `Wystąpił nieoczekiwany błąd: ${err.message} (${err.name}).`;
            }
            showError(userMessage);
            updateCameraUI(false);
            updateOcrUI(false);
        }
    } else {
        showError("Twoja przeglądarka nie obsługuje dostępu do kamery (API getUserMedia).");
        updateCameraUI(false);
        updateOcrUI(false);
    }
}

async function stopCamera() {
    hideError();
    if (isRealTimeScanningActive) await stopRealTimeScanning();

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (webcamElement) {
            webcamElement.srcObject = null;
        }
        stream = null;
        videoTrack = null;
    }
    updateCameraUI(false);

    const photoIsAvailable = !!photoResultElement?.src && photoResultElement.src !== '#';
    const textHasBeenRecognized = recognizedTextElement?.value.trim() !== '';

    updateOcrUI(photoIsAvailable, textHasBeenRecognized);

    if (!photoIsAvailable) {
        if (!textHasBeenRecognized) {
            if (recognizedTextElement) recognizedTextElement.value = '';
            if (ocrResultContainer) ocrResultContainer.classList.add('hidden');
            updateOcrUI(false);
        }
    }
}

async function recognizeTextFromImageApi(base64ImageData, isRealTime = false) {
    // Sprawdź i zainicjuj AI jeśli potrzeba
    if (!ai) {
        const initialized = initializeGeminiAI();
        if (!initialized) {
            if (!isRealTime) showError("Usługa rozpoznawania tekstu nie jest zainicjalizowana. Sprawdź klucz API.");
            return null;
        }
    }
    if (!base64ImageData.startsWith('data:image/')) {
        showError("Niepoprawny format danych obrazu dla OCR.");
        return null;
    }

    const mimeType = base64ImageData.substring(base64ImageData.indexOf(':') + 1, base64ImageData.indexOf(';'));
    const base64Data = base64ImageData.substring(base64ImageData.indexOf(',') + 1);

    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Data,
        },
    };
    const textPart = {
        text: isRealTime ? "Szybko odczytaj cały tekst z tego obrazu. Podaj tylko odczytany tekst." : "Dokładnie odczytaj cały tekst widoczny na tym obrazie. Podaj tylko odczytany tekst, bez dodatkowych komentarzy i formatowania markdown."
    };

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const response = await model.generateContent([imagePart, textPart]);
        return response.response.text();
    } catch (error) {
        console.error("Błąd podczas rozpoznawania tekstu (API):", error);
        if (!isRealTime) {
            showError(`Błąd API Gemini podczas rozpoznawania tekstu: ${error.message}`);
        }
        return null;
    }
}

async function processFrameForRealTimeScan() {
    if (!isRealTimeScanningActive || isProcessingFrame || !webcamElement || webcamElement.paused || webcamElement.ended || !canvasElement || !ai) {
        if (!isRealTimeScanningActive) isProcessingFrame = false;
        return;
    }

    isProcessingFrame = true;
    if (realTimeScanStatusElement) {
        realTimeScanStatusElement.textContent = "Przetwarzanie klatki...";
        realTimeScanStatusElement.classList.remove('hidden');
    }
    if (ocrResultContainer) ocrResultContainer.classList.remove('hidden');

    const videoWidth = webcamElement.videoWidth;
    const videoHeight = webcamElement.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) {
        console.warn("Nie można uzyskać wymiarów wideo dla skanowania ciągłego.");
        isProcessingFrame = false;
        if (realTimeScanStatusElement) realTimeScanStatusElement.textContent = "Błąd klatki. Ponawiam...";
        return;
    }

    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;
    const context = canvasElement.getContext('2d');

    if (context) {
        context.drawImage(webcamElement, 0, 0, videoWidth, videoHeight);

        const imageDataUrl = canvasElement.toDataURL('image/jpeg', 0.8);
        const recognizedContent = await recognizeTextFromImageApi(imageDataUrl, true);

        if (isRealTimeScanningActive) {
            if (recognizedContent !== null) {
                const trimmedContent = recognizedContent.trim();
                if (trimmedContent) {
                    if (recognizedTextElement) recognizedTextElement.value = trimmedContent;
                    if (realTimeTextOverlay) {
                        realTimeTextOverlay.textContent = trimmedContent;
                        realTimeTextOverlay.classList.remove('hidden');
                    }
                } else {
                    if (realTimeTextOverlay) realTimeTextOverlay.classList.add('hidden');
                }
            } else {
                if (realTimeTextOverlay) {
                    realTimeTextOverlay.textContent = 'Błąd odczytu';
                    realTimeTextOverlay.classList.remove('hidden');
                }
            }
            const hasPersistedContent = !!(recognizedTextElement?.value.trim());
            updateOcrUI(false, hasPersistedContent, false);
        }
    }
    isProcessingFrame = false;
    if (isRealTimeScanningActive && realTimeScanStatusElement) {
        realTimeScanStatusElement.textContent = "Skanowanie w toku...";
    } else if (!isRealTimeScanningActive && realTimeScanStatusElement) {
        realTimeScanStatusElement.classList.add('hidden');
    }
}

async function startRealTimeScanning() {
    if (!ai || !stream) {
        showError("Kamera musi być aktywna, a usługa AI dostępna, aby rozpocząć skanowanie ciągłe.");
        return;
    }
    hideError();
    isRealTimeScanningActive = true;
    if (scannerOverlayElement) scannerOverlayElement.classList.remove('hidden');
    if (realTimeTextOverlay) realTimeTextOverlay.classList.add('hidden');
    if (zoomControls) zoomControls.classList.add('hidden');

    if (startRealTimeScanBtn) {
        startRealTimeScanBtn.innerHTML = `<i class="fas fa-stop-circle"></i> <span class="btn-text">Zatrzymaj</span>`;
        startRealTimeScanBtn.ariaLabel = "Zatrzymaj Skanowanie Ciągłe";
        startRealTimeScanBtn.disabled = false;
    }
    if (takePhotoBtn) takePhotoBtn.disabled = true;
    if (recognizeTextBtn) recognizeTextBtn.disabled = true;

    if (photoContainer) photoContainer.classList.add('hidden');
    if (photoPlaceholder) photoPlaceholder.classList.remove('hidden');
    if (downloadPhotoLink) downloadPhotoLink.classList.add('hidden');

    if (recognizedTextElement) recognizedTextElement.value = "Rozpoczynanie skanowania...";
    if (ocrResultContainer) ocrResultContainer.classList.remove('hidden');
    if (realTimeScanStatusElement) {
        realTimeScanStatusElement.textContent = "Skanowanie w toku...";
        realTimeScanStatusElement.classList.remove('hidden');
    }

    updateOcrUI(false, false, false);

    if (realTimeScanIntervalId) clearInterval(realTimeScanIntervalId);
    realTimeScanIntervalId = setInterval(processFrameForRealTimeScan, REAL_TIME_SCAN_INTERVAL_MS);
    await processFrameForRealTimeScan();
}

async function stopRealTimeScanning() {
    isRealTimeScanningActive = false;
    isProcessingFrame = false;
    if (scannerOverlayElement) scannerOverlayElement.classList.add('hidden');
    if (realTimeTextOverlay) realTimeTextOverlay.classList.add('hidden');
    if (realTimeScanIntervalId) {
        clearInterval(realTimeScanIntervalId);
        realTimeScanIntervalId = null;
    }
    if (startRealTimeScanBtn) {
        startRealTimeScanBtn.innerHTML = `<i class="fas fa-qrcode"></i> <span class="btn-text">Scan Live</span>`;
        startRealTimeScanBtn.ariaLabel = "Rozpocznij Skanowanie Ciągłe";
    }
    if (realTimeScanStatusElement) {
        realTimeScanStatusElement.classList.add('hidden');
    }
    if (videoTrack && zoomControls) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.zoom) zoomControls.classList.remove('hidden');
    }

    if (photoPlaceholder) photoPlaceholder.classList.add('hidden');

    updateCameraUI(!!stream);

    const textHasBeenRecognized = !!(recognizedTextElement?.value.trim());

    updateOcrUI(false, textHasBeenRecognized, false);
}

// Funkcja do bezpiecznego odtwarzania dźwięku
function playSnapSound() {
    if (!snapSound) return;

    try {
        snapSound.currentTime = 0;
        const playPromise = snapSound.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.info("Dźwięk migawki nie może być odtworzony (wymaga interakcji użytkownika):", error.name);
                // Nie pokazujemy błędu użytkownikowi - to normalne zachowanie przeglądarki
            });
        }
    } catch (error) {
        console.info("Błąd odtwarzania dźwięku migawki:", error.name);
    }
}

// Inicjalizacja audio po pierwszej interakcji użytkownika
function initializeAudio() {
    if (audioInitialized || !snapSound) return;

    try {
        snapSound.volume = 0.1; // Ustawamy niską głośność dla testu
        const playPromise = snapSound.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                snapSound.pause();
                snapSound.currentTime = 0;
                snapSound.volume = 1; // Przywracamy normalną głośność
                audioInitialized = true;
                console.info("Audio zainicjalizowane pomyślnie");
            }).catch(() => {
                // Audio nadal zablokowane, spróbujemy później
            });
        }
    } catch (error) {
        // Ignorujemy błędy inicjalizacji
    }
}

// Event listener dla pierwszej interakcji z dokumentem
function handleFirstInteraction() {
    initializeAudio();
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('keydown', handleFirstInteraction);
    document.removeEventListener('touchstart', handleFirstInteraction);
}

// Event Listeners
toggleCameraBtn?.addEventListener('click', async () => {
    if (stream) {
        await stopCamera();
    } else {
        await startCamera();
    }
});

takePhotoBtn?.addEventListener('click', async () => {
    hideError();
    if (isRealTimeScanningActive) await stopRealTimeScanning();

    if (stream && webcamElement && canvasElement && photoResultElement && photoContainer && photoPlaceholder && downloadPhotoLink && snapSound) {
        if (webcamElement.readyState < webcamElement.HAVE_METADATA || webcamElement.paused || webcamElement.ended) {
            showError("Wideo z kamery nie jest jeszcze gotowe lub nie jest odtwarzane.");
            return;
        }

        const videoWidth = webcamElement.videoWidth;
        const videoHeight = webcamElement.videoHeight;

        if (videoWidth === 0 || videoHeight === 0) {
            showError("Nie można uzyskać wymiarów wideo z kamery. Spróbuj ponownie uruchomić kamerę.");
            return;
        }

        canvasElement.width = videoWidth;
        canvasElement.height = videoHeight;

        const context = canvasElement.getContext('2d');
        if (context) {
            const currentTrackSettings = stream.getVideoTracks()[0]?.getSettings();
            if (currentTrackSettings && currentTrackSettings.facingMode === 'user') {
                context.translate(videoWidth, 0);
                context.scale(-1, 1);
            }

            context.drawImage(webcamElement, 0, 0, videoWidth, videoHeight);
            context.setTransform(1, 0, 0, 1, 0, 0);

            // Odtwórz dźwięk migawki z obsługą błędów autoplay
            playSnapSound();

            const imageDataUrl = canvasElement.toDataURL('image/png');

            photoResultElement.src = imageDataUrl;
            photoResultElement.onload = () => {
                photoContainer.classList.remove('hidden');
                photoPlaceholder.classList.add('hidden');
            }

            downloadPhotoLink.href = imageDataUrl;
            downloadPhotoLink.classList.remove('hidden');

            updateOcrUI(true, false);
            if (recognizedTextElement) recognizedTextElement.value = '';
            if (ocrResultContainer) ocrResultContainer.classList.remove('hidden');
        } else {
            showError("Nie udało się uzyskać kontekstu 2D z canvasu.");
        }
    } else {
        showError("Niektóre elementy potrzebne do zrobienia zdjęcia nie są dostępne. Spróbuj odświeżyć stronę.");
    }
});

zoomSlider?.addEventListener('input', () => {
    if (!videoTrack || !zoomSlider || !zoomValueLabel) return;
    try {
        const zoomValue = parseFloat(zoomSlider.value);
        videoTrack.applyConstraints({ advanced: [{ zoom: zoomValue }] });
        zoomValueLabel.textContent = `${zoomValue.toFixed(1)}x`;
    } catch (error) {
        console.error("Błąd podczas ustawiania zoomu:", error);
    }
});

recognizeTextBtn?.addEventListener('click', async () => {
    if (isRealTimeScanningActive) {
        showError("Zatrzymaj skanowanie ciągłe, aby rozpoznać tekst ze statycznego zdjęcia.");
        return;
    }
    if (!photoResultElement || !photoResultElement.src || photoResultElement.src === '#' || photoResultElement.src.startsWith('blob:')) {
        showError("Najpierw zrób zdjęcie, aby móc rozpoznać tekst.");
        return;
    }
    if (!ai) {
        showError("Usługa rozpoznawania tekstu nie jest dostępna.");
        return;
    }

    hideError();
    if (recognizedTextElement) recognizedTextElement.value = '';
    updateOcrUI(true, false, true);

    const imageDataUrl = photoResultElement.src;
    const recognizedContent = await recognizeTextFromImageApi(imageDataUrl, false);

    const hasContent = recognizedContent !== null && recognizedContent.trim() !== "";
    updateOcrUI(true, hasContent, false);

    if (recognizedContent !== null) {
        if (recognizedContent.trim() === "") {
            if (recognizedTextElement) recognizedTextElement.value = "Nie rozpoznano tekstu na obrazie lub obraz jest pusty.";
        } else {
            if (recognizedTextElement) recognizedTextElement.value = recognizedContent;
        }
    } else {
        if (recognizedTextElement) recognizedTextElement.value = "Nie udało się rozpoznać tekstu. Spróbuj ponownie lub użyj innego obrazu.";
    }
});

startRealTimeScanBtn?.addEventListener('click', async () => {
    if (!ai) {
        showError("Usługa rozpoznawania tekstu jest niedostępna.");
        return;
    }
    if (!stream) {
        showError("Najpierw uruchom kamerę.");
        return;
    }
    if (isRealTimeScanningActive) {
        await stopRealTimeScanning();
    } else {
        await startRealTimeScanning();
    }
});

copyTextBtn?.addEventListener('click', () => {
    if (recognizedTextElement && recognizedTextElement.value.trim() && !isProcessingFrame) {
        navigator.clipboard.writeText(recognizedTextElement.value)
            .then(() => {
                if (copyTextBtn) {
                    const originalHTML = copyTextBtn.innerHTML;
                    copyTextBtn.innerHTML = `<i class="fas fa-check"></i> <span class="btn-text">Skopiowano!</span>`;
                    copyTextBtn.disabled = true;
                    setTimeout(() => {
                        if (copyTextBtn) {
                            copyTextBtn.innerHTML = originalHTML;
                            updateOcrUI(!!photoResultElement?.src, !!recognizedTextElement?.value.trim());
                        }
                    }, 2000);
                }
            })
            .catch(err => {
                console.error("Nie udało się skopiować tekstu: ", err);
                showError("Nie udało się skopiować tekstu do schowka. Spróbuj ręcznie.");
            });
    } else {
        showError("Brak tekstu do skopiowania lub trwa przetwarzanie.");
    }
});

downloadTextBtn?.addEventListener('click', () => {
    if (recognizedTextElement && recognizedTextElement.value.trim() && !isProcessingFrame) {
        const textToSave = recognizedTextElement.value;
        const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rozpoznany_tekst.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        showError("Brak tekstu do pobrania lub trwa przetwarzanie.");
    }
});

fillFormBtn?.addEventListener('click', () => {
    if (!recognizedTextElement || !tractorInput || !trailerInput || !recognizedTextElement.value.trim()) {
        showError("Brak tekstu do uzupełnienia formularza.");
        return;
    }
    hideError();

    const tokens = recognizedTextElement.value.trim().split(/\s+/).filter(token => token.length > 0);

    tractorInput.value = '';
    trailerInput.value = '';

    const highlightInput = (input) => {
        if (!input) return;
        input.classList.add('input-filled-highlight');
        setTimeout(() => {
            input.classList.remove('input-filled-highlight');
        }, 600);
    };

    if (tokens.length > 0) {
        tractorInput.value = tokens[0];
        highlightInput(tractorInput);
    }

    if (tokens.length > 1) {
        setTimeout(() => {
            if (trailerInput) {
                trailerInput.value = tokens[1];
                highlightInput(trailerInput);
            }
        }, 300);
    }
});

//Event Listeners dla API konfiguracji
document.getElementById('api-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveApiKey();
});

toggleApiVisibilityBtn?.addEventListener('click', () => {
    if (!apiKeyInput || !toggleApiVisibilityBtn) return;

    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';

    const icon = toggleApiVisibilityBtn.querySelector('i');
    if (icon) {
        icon.className = `fas ${isPassword ? 'fa-eye-slash' : 'fa-eye'}`;
    }

    toggleApiVisibilityBtn.title = isPassword ? 'Ukryj klucz' : 'Pokaż klucz';
});

toggleApiSectionBtn?.addEventListener('click', () => {
    if (!apiContent || !toggleApiSectionBtn) return;

    const isCollapsed = apiContent.classList.contains('collapsed');

    if (isCollapsed) {
        // Rozwiń sekcję
        apiContent.classList.remove('collapsed');
        toggleApiSectionBtn.classList.remove('collapsed');
        toggleApiSectionBtn.title = 'Ukryj konfigurację API';
    } else {
        // Zwiń sekcję
        apiContent.classList.add('collapsed');
        toggleApiSectionBtn.classList.add('collapsed');
        toggleApiSectionBtn.title = 'Pokaż konfigurację API';
    }
});

// Możliwość kliknięcia na header żeby zwinąć/rozwinąć
document.querySelector('.api-header')?.addEventListener('click', (e) => {
    // Nie reaguj na kliknięcia w przycisk toggle
    if (e.target.closest('#toggle-api-section')) return;

    // Symuluj kliknięcie przycisku toggle
    toggleApiSectionBtn?.click();
});

// Usunięte - formularz obsługuje Enter automatycznie

apiKeyInput?.addEventListener('input', () => {
    // Sprawdź czy klucz wygląda poprawnie (zaczyna się od AIza)
    const key = apiKeyInput.value.trim();
    if (key && !key.startsWith('AIza')) {
        apiKeyInput.style.borderColor = '#f87171'; // red-400
    } else {
        apiKeyInput.style.borderColor = '';
    }
});

// Dodaj event listenery dla pierwszej interakcji (inicjalizacja audio)
document.addEventListener('click', handleFirstInteraction);
document.addEventListener('keydown', handleFirstInteraction);
document.addEventListener('touchstart', handleFirstInteraction);

// Inicjalizacja aplikacji
loadApiKey();
initializeGeminiAI();
updateCameraUI(false);
updateOcrUI(false);

// Sprawdzenie dostępności wszystkich elementów DOM
const allElementIds = [
    'webcam', 'canvas', 'photo-result', 'toggle-camera-btn', 'take-photo',
    'download-photo', 'snap-sound', 'placeholder', 'photo-container',
    'photo-placeholder', 'error-message', 'error-text', 'recognize-text',
    'copy-text', 'download-text-btn', 'recognized-text', 'ocr-loading-indicator',
    'ocr-result-container', 'start-real-time-scan', 'real-time-scan-status',
    'scanner-overlay', 'zoom-controls', 'zoom-slider', 'zoom-value',
    'real-time-text-overlay', 'fill-form-btn', 'tractor-input', 'trailer-input',
    'api-key-input', 'save-api-key', 'toggle-api-visibility', 'api-status',
    'toggle-api-section', 'api-content', 'api-form'
];

const missingElements = allElementIds.filter(id => !document.getElementById(id));

if (missingElements.length > 0) {
    const errorMessage = `Wystąpił krytyczny błąd ładowania aplikacji. Niektóre elementy interfejsu użytkownika (ID: ${missingElements.join(', ')}) nie zostały znalezione. Sprawdź, czy plik HTML nie został zmieniony.`;
    console.error(errorMessage, { missingElements });
    showError(errorMessage);
}

// Informacje w konsoli
console.log("🔑 Aplikacja Scan For-Text uruchomiona!");
console.log("💡 Wprowadź klucz API Gemini w polu powyżej lub ustaw przez:");
console.log("   localStorage.setItem('GEMINI_API_KEY', 'twój_klucz_api')"); 
