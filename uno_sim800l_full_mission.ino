#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 
// IMPORTANT: Use the HTTP URL from your ngrok terminal.
const char* SERVER_URL_BASE = "http://7f8e8b835319.ngrok-free.app"; // Using your server's public HTTP address
const char* DRONE_ID = "SB-001";

// --- Helper Functions ---
String sendATCommand(const char* command, unsigned long timeout) {
    String response = "";
    sim.println(command);
    Serial.print("Sent: ");
    Serial.println(command);

    unsigned long startTime = millis();
    while (millis() - startTime < timeout) {
        if (sim.available()) {
            char c = sim.read();
            response += c;
        }
    }
    Serial.print("Recv: ");
    Serial.println(response);
    return response;
}

bool expectResponse(const String& response, const char* expected) {
    if (response.indexOf(expected) != -1) {
        return true;
    }
    Serial.print("[ERROR] Expected '");
    Serial.print(expected);
    Serial.println("' but did not receive it.");
    return false;
}

bool isGprsConnected() {
    String response = sendATCommand("AT+SAPBR=2,1", 3000);
    // A valid response will contain the bearer status and an IP address like:
    // +SAPBR: 1,1,"100.118.123.123"
    // We check for the second comma to confirm an IP was assigned.
    int firstComma = response.indexOf(',');
    int secondComma = response.indexOf(',', firstComma + 1);
    return (secondComma != -1);
}

bool initializeSIM() {
    Serial.println("Initializing SIM800L...");
    sim.begin(9600);
    delay(1000);

    if (!expectResponse(sendATCommand("AT", 2000), "OK")) return false;
    if (!expectResponse(sendATCommand("ATE0", 2000), "OK")) return false; // Disable command echo

    Serial.println("Checking network...");
    if (!expectResponse(sendATCommand("AT+CPIN?", 5000), "READY")) return false;
    if (!expectResponse(sendATCommand("AT+CSQ", 5000), "OK")) return false;
    if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) return false;
    
    Serial.println("Setting up GPRS Bearer...");
    // Close any existing bearer context (good practice)
    sendATCommand("AT+SAPBR=0,1", 3000); 
    delay(1000);

    // Set connection type to GPRS
    if (!expectResponse(sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 5000), "OK")) return false;

    // Set the APN
    String cmd = "AT+SAPBR=3,1,\"APN\",\"";
    cmd += APN;
    cmd += "\"";
    if (!expectResponse(sendATCommand(cmd.c_str(), 5000), "OK")) return false;

    // Open the GPRS context (bearer)
    if (!expectResponse(sendATCommand("AT+SAPBR=1,1", 20000), "OK")) { // Long timeout for network negotiation
        Serial.println("[ERROR] Failed to open GPRS bearer.");
        return false;
    }

    // Query the bearer status to get an IP address
    if (!isGprsConnected()) {
        Serial.println("[ERROR] Failed to get an IP address.");
        return false;
    }

    Serial.println("GPRS connection is ready.");
    return true;
}

void getMissionDetails() {
    Serial.println("\nRequesting new mission details...");
    
    // --- Initialize HTTP ---
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    // --- Set URL ---
    String get_url = String(SERVER_URL_BASE) + "/api/getMission?droneId=" + String(DRONE_ID);
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + get_url + "\"";
    
    Serial.println("Requesting: " + get_url);
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    // --- Perform GET Action ---
    // This command is sent, and we will wait for the async "+HTTPACTION" response
    sendATCommand("AT+HTTPACTION=0", 1000); 
    
    String actionResponse = "";
    unsigned long actionStart = millis();
    bool actionComplete = false;
    while(millis() - actionStart < 20000) { // 20 second timeout for the action
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        line.trim(); // Remove any leading/trailing whitespace
        if(line.startsWith("+HTTPACTION:")){
           Serial.println("Action response received: " + line);
           actionResponse = line;
           actionComplete = true;
           break;
        }
      }
    }

    if (!actionComplete || actionResponse.indexOf("200") == -1) {
        Serial.println("[ERROR] HTTP GET failed. Check server URL and network.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    Serial.println("HTTP GET Success. Reading response...");

    // --- Read Data ---
    // The data is now available to be read from the module's buffer
    sendATCommand("AT+HTTPREAD", 10000); // This command returns the data
    
    String jsonResponse = "";
    unsigned long readStart = millis();
    bool jsonStarted = false;
    while(millis() - readStart < 5000) {
      if(sim.available()) {
        char c = sim.read();
        Serial.write(c);
        if(c == '{') jsonStarted = true;
        if(jsonStarted) jsonResponse += c;
        if(c == '}' && jsonStarted) break; // Basic check for end of JSON
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000); // Terminate HTTP session

    Serial.println("\nExtracted JSON: " + jsonResponse);

    if (jsonResponse.length() > 0 && jsonResponse.indexOf('{') != -1) {
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, jsonResponse);

        if (error) {
            Serial.print("[ERROR] JSON Parse Failed: ");
            Serial.println(error.c_str());
            return;
        }

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            float latitude = doc["latitude"];
            float longitude = doc["longitude"];
            const char* orderId = doc["orderId"];

            Serial.println("\n--- Mission Details ---");
            Serial.print("Order ID: ");
            Serial.println(orderId);
            Serial.print("Latitude: ");
            Serial.println(latitude, 6);
            Serial.print("Longitude: ");
            Serial.println(longitude, 6);
            Serial.println("------------------------");
            
            // Now that we have a mission, let's post a status update
            updateDroneStatus(latitude, longitude, 95, "Delivering");
        } else {
            Serial.println("[INFO] Server response did not contain mission details. Waiting.");
        }
    } else {
        Serial.println("[ERROR] No JSON object found in HTTP response.");
    }
}

void updateDroneStatus(float lat, float lon, int battery, const char* status) {
    Serial.println("\nSending drone status update...");
    
    // --- Create JSON Payload ---
    DynamicJsonDocument doc(256);
    doc["droneId"] = DRONE_ID;
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["battery"] = battery;
    doc["status"] = status;

    String payload;
    serializeJson(doc, payload);
    int payloadLength = payload.length();

    // --- Initialize HTTP for POST ---
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;

    // --- Set URL for POST ---
    String post_url = String(SERVER_URL_BASE) + "/api/updateDroneStatus";
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + post_url + "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    // Set content type for JSON
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    // --- Prepare to send data ---
    String data_cmd = "AT+HTTPDATA=" + String(payloadLength) + ",10000"; // 10 second timeout to provide data
    if (!expectResponse(sendATCommand(data_cmd.c_str(), 5000), "DOWNLOAD")) {
        Serial.println("[ERROR] Failed to prepare for data upload.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    // Send the actual JSON payload
    sendATCommand(payload.c_str(), 10000);
    
    // --- Perform POST Action ---
    sendATCommand("AT+HTTPACTION=1", 1000); // POST action
    
    String actionResponse = "";
    unsigned long actionStart = millis();
    bool actionComplete = false;
    while(millis() - actionStart < 20000) { // 20 second timeout for the action
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        line.trim();
        if(line.startsWith("+HTTPACTION:")){
           Serial.println("Action response received: " + line);
           actionResponse = line;
           actionComplete = true;
           break;
        }
      }
    }
    
    if (actionComplete && actionResponse.indexOf("200") != -1) {
        Serial.println("Status update sent successfully.");
    } else {
        Serial.println("[ERROR] Status update failed.");
    }

    // Read response from server (optional, but good practice)
    sendATCommand("AT+HTTPREAD", 5000);
    
    sendATCommand("AT+HTTPTERM", 3000);
}


// --- Arduino Standard Functions ---
void setup() {
    Serial.begin(9600);
    while (!Serial); // Wait for serial monitor to open

    if (!initializeSIM()) {
        Serial.println("\n[FATAL] SIM Initialization failed. Retrying in 30s...");
        delay(30000);
        // In a real scenario, you might want to try to re-initialize or enter a safe mode.
        // For this example, we'll let the loop handle retries.
    } else {
       Serial.println("\nSystem Ready.");
    }
}

void loop() {
    if (!isGprsConnected()) {
        Serial.println("[WARNING] GPRS Disconnected. Re-initializing...");
        initializeSIM();
    } else {
        getMissionDetails();
    }
    
    Serial.println("\nWaiting 30 seconds before next request...");
    delay(30000); 
}
