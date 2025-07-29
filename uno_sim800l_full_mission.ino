
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
// Connect SIM800L TX to Arduino D10, RX to D11
SoftwareSerial sim(10, 11);

// --- Configuration ---
const char* APN = "airtelgprs.com"; // Change to your network's APN if needed
const char* DRONE_ID = "SB-001";     // The ID of this specific drone

// IMPORTANT: This URL MUST be updated if you restart ngrok.
const char* SERVER_URL = "https://7f8e8b835319.ngrok-free.app";

// --- Global Variables for Drone State ---
float currentLatitude = 19.0760;  // Example starting location (Mumbai)
float currentLongitude = 72.8777;
int batteryLevel = 98;
String droneStatus = "Idle";
String currentOrderId = "";


// =================================================================
// ============== AT COMMAND & HELPER FUNCTIONS ====================
// =================================================================

/**
 * @brief Sends an AT command to the SIM800L and waits for a response.
 * @param command The AT command to send.
 * @param timeout The time to wait for a response in milliseconds.
 * @return The response string from the module.
 */
String sendATCommand(const char* command, unsigned long timeout) {
    String response = "";
    sim.println(command);
    Serial.print("Sent --> ");
    Serial.println(command);

    unsigned long startTime = millis();
    while (millis() - startTime < timeout) {
        if (sim.available()) {
            char c = sim.read();
            response += c;
        }
    }
    // Clean up response by removing the original command echo and extra whitespace
    response.replace(String(command) + "\r\n", "");
    response.trim();

    Serial.print("Recv <-- ");
    Serial.println(response);
    return response;
}

/**
 * @brief Checks if a response string contains an expected substring.
 * @param response The response from the module.
 * @param expected The substring to look for (e.g., "OK", "ERROR").
 * @return True if the expected substring is found, false otherwise.
 */
bool expectResponse(const String& response, const char* expected) {
    if (response.indexOf(expected) != -1) {
        return true;
    }
    Serial.print("[FAIL] Expected '");
    Serial.print(expected);
    Serial.println("', but did not receive it.");
    return false;
}

/**
 * @brief Performs a clean termination of the HTTP session.
 */
void terminateHttp() {
    sendATCommand("AT+HTTPTERM", 3000);
}


// =================================================================
// ==================== INITIALIZATION =============================
// =================================================================

/**
 * @brief Checks if GPRS is still connected by querying for an IP address.
 * @return True if connected, false otherwise.
 */
bool isGprsConnected() {
    String response = sendATCommand("AT+SAPBR=2,1", 5000);
    // A valid response will contain an IP address in quotes, like "100.107.115.163"
    // An invalid or disconnected state will not.
    if (response.indexOf("+SAPBR: 1,1") != -1) {
        return true;
    }
    return false;
}

/**
 * @brief Initializes the SIM800L module, connects to GPRS, and gets an IP.
 * @return True on success, false on failure.
 */
bool initializeSIM() {
    Serial.println("--- Initializing SIM800L ---");
    sim.begin(9600);
    delay(1000);

    if (!expectResponse(sendATCommand("AT", 2000), "OK")) return false;
    if (!expectResponse(sendATCommand("ATE0", 2000), "OK")) return false; // Disable command echo

    Serial.println("Checking network status...");
    if (!expectResponse(sendATCommand("AT+CPIN?", 5000), "READY")) return false;
    if (!expectResponse(sendATCommand("AT+CSQ", 5000), "OK")) return false;
    if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) return false;

    Serial.println("Setting up GPRS Bearer Profile...");
    // Close any existing bearer context first for a clean start
    sendATCommand("AT+SAPBR=0,1", 3000);
    delay(1000);

    if (!expectResponse(sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 5000), "OK")) return false;

    String cmd = "AT+SAPBR=3,1,\"APN\",\"";
    cmd += APN;
    cmd += "\"";
    if (!expectResponse(sendATCommand(cmd.c_str(), 5000), "OK")) return false;

    Serial.println("Opening GPRS context...");
    if (!expectResponse(sendATCommand("AT+SAPBR=1,1", 20000), "OK")) {
        Serial.println("[FAIL] Failed to open GPRS bearer.");
        return false;
    }

    if (!isGprsConnected()) {
        Serial.println("[FAIL] Could not verify GPRS connection.");
        return false;
    }

    Serial.println("--- SIM Initialized Successfully ---");
    return true;
}


// =================================================================
// =================== CORE LOGIC FUNCTIONS ========================
// =================================================================

/**
 * @brief Makes a GET request to the server to fetch new mission details.
 */
void getMissionDetails() {
    Serial.println("\n>>> Requesting new mission...");

    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) { terminateHttp(); return; }

    // Enable SSL for HTTPS
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) { terminateHttp(); return; }

    // Construct the full URL for the GET request
    String get_url = String(SERVER_URL) + "/api/getMission?droneId=" + String(DRONE_ID);
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + get_url + "\"";
    Serial.println("Requesting URL: " + get_url);
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) { terminateHttp(); return; }

    // Perform GET Action
    String actionResponse = sendATCommand("AT+HTTPACTION=0", 20000);
    if (actionResponse.indexOf("200") == -1) { // Check for HTTP 200 OK
        Serial.println("[FAIL] HTTP GET failed. Server may be down or URL is wrong.");
        terminateHttp();
        return;
    }

    Serial.println("GET Success. Reading response...");
    String jsonResponse = sendATCommand("AT+HTTPREAD", 10000);
    terminateHttp(); // Terminate session after reading

    if (jsonResponse.length() > 2) { // Check if response is more than just "{}"
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, jsonResponse);

        if (error) {
            Serial.print("[FAIL] JSON Parse Failed: ");
            Serial.println(error.c_str());
            return;
        }

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            // Update drone's target and status
            currentLatitude = doc["latitude"];
            currentLongitude = doc["longitude"];
            currentOrderId = String(doc["orderId"]);
            droneStatus = "Delivering";

            Serial.println("\n--- NEW MISSION ACQUIRED ---");
            Serial.print("  Order ID: "); Serial.println(currentOrderId);
            Serial.print("  Go to Lat: "); Serial.println(currentLatitude, 6);
            Serial.print("  Go to Lon: "); Serial.println(currentLongitude, 6);
            Serial.println("----------------------------");
        } else {
            Serial.println("[INFO] No mission currently available for this drone.");
            droneStatus = "Idle";
        }
    } else {
        Serial.println("[INFO] No mission currently available for this drone.");
        droneStatus = "Idle";
    }
}

/**
 * @brief Makes a POST request to the server to update the drone's status.
 */
void updateDroneStatus() {
    Serial.println("\n>>> Sending status update...");

    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) { terminateHttp(); return; }
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) { terminateHttp(); return; }

    String post_url = String(SERVER_URL) + "/api/updateDroneStatus";
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + post_url + "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) { terminateHttp(); return; }

    // Set content type to JSON
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) { terminateHttp(); return; }

    // Create JSON payload
    String jsonPayload;
    DynamicJsonDocument doc(256);
    doc["droneId"] = DRONE_ID;
    doc["latitude"] = currentLatitude;
    doc["longitude"] = currentLongitude;
    doc["battery"] = batteryLevel;
    doc["status"] = droneStatus;
    serializeJson(doc, jsonPayload);

    // Prepare to send data
    String data_cmd = "AT+HTTPDATA=" + String(jsonPayload.length()) + ",10000";
    if (!expectResponse(sendATCommand(data_cmd.c_str(), 5000), "DOWNLOAD")) {
        Serial.println("[FAIL] Failed to prepare for data send.");
        terminateHttp();
        return;
    }

    // Send the JSON payload
    // We don't use expectResponse here as the final "OK" comes after the action
    sendATCommand(jsonPayload.c_str(), 10000);
    Serial.println("Payload sent.");

    // Perform POST Action
    String actionResponse = sendATCommand("AT+HTTPACTION=1", 20000);
    if (actionResponse.indexOf("200") == -1) {
        Serial.println("[FAIL] HTTP POST failed. Server error or bad data.");
    } else {
        Serial.println("POST Success. Status updated on server.");
    }
    
    terminateHttp();
}


// =================================================================
// ============== ARDUINO STANDARD FUNCTIONS =======================
// =================================================================

void setup() {
    Serial.begin(9600);
    while (!Serial); // Wait for serial monitor to open

    if (!initializeSIM()) {
        Serial.println("\n[FATAL] Could not initialize SIM module. Halting.");
        while (true); // Halt system
    }
}

void loop() {
    // Before doing anything, check if we are still connected to the internet.
    if (!isGprsConnected()) {
        Serial.println("[WARN] GPRS disconnected. Attempting to reconnect...");
        if (!initializeSIM()) {
            Serial.println("[FATAL] Reconnection failed. Waiting before retry...");
            delay(30000);
            return; // Skip this loop iteration
        }
    }

    // If the drone is idle, it should ask for a new mission.
    if (droneStatus == "Idle") {
        getMissionDetails();
    } 
    // If it's on a mission, it should just send status updates.
    else if (droneStatus == "Delivering") {
        // In a real drone, you would update the lat/lon as it moves.
        // For this simulation, we'll just send the same status.
        updateDroneStatus();
        
        // Here you would add logic to check if the drone has reached its destination.
        // For now, we'll just pretend it completes after one update.
        Serial.println("[SIM] Drone has 'reached' destination.");
        droneStatus = "Idle";
        batteryLevel -= 5; // Simulate battery drain
    }

    Serial.println("\n--- Loop Complete. Waiting 30 seconds. ---");
    delay(30000);
}
