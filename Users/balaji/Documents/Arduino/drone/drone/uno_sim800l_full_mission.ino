
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com";

// =======================================================================================
// IMPORTANT: REPLACE THIS URL with the "Forwarding" URL from your ngrok terminal.
// It should start with https:// and end with .ngrok-free.app
// For example: https://9b7b-103-21-125-0.ngrok-free.app
// =======================================================================================
const char* BASE_SERVER_URL = "https://a1b2-c3d4-e5f6-g7h8.ngrok-free.app"; // <-- PASTE YOUR NGROK URL HERE


// --- Global Variables ---
String droneId = "SB-001"; // The ID of this drone
String currentOrderId = "";

// --- Helper Functions ---
String sendATCommand(const char* command, unsigned long timeout, bool debug = true) {
    String response = "";
    sim.println(command);
    if (debug) {
      Serial.print("Sent: ");
      Serial.println(command);
    }

    unsigned long startTime = millis();
    while (millis() - startTime < timeout) {
        if (sim.available()) {
            char c = sim.read();
            response += c;
        }
    }
    if (debug) {
      Serial.print("Recv: ");
      Serial.println(response);
    }
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

// --- Core Functions ---
bool initializeSIM() {
    Serial.println("Initializing SIM800L...");
    sim.begin(9600);
    delay(1000);

    if (!expectResponse(sendATCommand("AT", 2000), "OK")) return false;
    if (!expectResponse(sendATCommand("ATE0", 2000), "OK")) return false;

    Serial.println("Checking network...");
    if (!expectResponse(sendATCommand("AT+CPIN?", 5000), "READY")) return false;
    if (!expectResponse(sendATCommand("AT+CSQ", 5000), "OK")) return false;
    if (!expectResponse(sendATCommand("AT+CGATT?", 5000), "+CGATT: 1")) return false;
    
    Serial.println("Setting up GPRS Bearer...");
    sendATCommand("AT+SAPBR=0,1", 3000); // Close any existing bearer
    delay(1000);

    if (!expectResponse(sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 5000), "OK")) return false;

    String cmd = "AT+SAPBR=3,1,\"APN\",\"";
    cmd += APN;
    cmd += "\"";
    if (!expectResponse(sendATCommand(cmd.c_str(), 5000), "OK")) return false;

    if (!expectResponse(sendATCommand("AT+SAPBR=1,1", 20000), "OK")) return false;
    if (!expectResponse(sendATCommand("AT+SAPBR=2,1", 5000), "OK")) return false;

    Serial.println("GPRS connection is ready.");
    return true;
}


bool isGprsConnected() {
    String response = sendATCommand("AT+SAPBR=2,1", 3000, false);
    // If the response contains "+SAPBR: 1,1," it means we have a valid IP.
    if (response.indexOf("+SAPBR: 1,1,") != -1) {
        return true;
    }
    return false;
}

void getMissionDetails() {
    Serial.println("\nRequesting new mission details...");
    
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    String url = String(BASE_SERVER_URL) + "/api/getMission?droneId=" + droneId;
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + url + "\"";
    
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    sendATCommand("AT+HTTPACTION=0", 20000);
    
    String responseBody = "";
    unsigned long readStart = millis();
    while(millis() - readStart < 10000) {
      if(sim.available()) {
        String line = sim.readStringUntil('\n');
        Serial.println(line);
        if(line.startsWith("{")) {
          responseBody = line;
        }
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000);

    if (responseBody.length() > 0) {
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, responseBody);

        if (error) {
            Serial.print("[ERROR] JSON Parse Failed: ");
            Serial.println(error.c_str());
            return;
        }

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            float latitude = doc["latitude"];
            float longitude = doc["longitude"];
            currentOrderId = String(doc["orderId"]);

            Serial.println("\n--- Mission Details Received ---");
            Serial.print("Order ID: "); Serial.println(currentOrderId);
            Serial.print("Latitude: "); Serial.println(latitude, 6);
            Serial.print("Longitude: "); Serial.println(longitude, 6);
            Serial.println("---------------------------------");
            // Here you would add logic to start the drone's flight
        } else {
            Serial.println("[INFO] No mission currently available for this drone.");
        }
    } else {
        Serial.println("[ERROR] No valid JSON response from server.");
    }
}

void updateDroneStatus(float lat, float lon, int battery, const char* status) {
    Serial.println("\nUpdating drone status...");

    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    String url = String(BASE_SERVER_URL) + "/api/updateDroneStatus";
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + url + "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    // Create JSON payload
    String jsonPayload = "";
    jsonPayload += "{";
    jsonPayload += "\"droneId\":\"" + droneId + "\",";
    jsonPayload += "\"latitude\":" + String(lat, 6) + ",";
    jsonPayload += "\"longitude\":" + String(lon, 6) + ",";
    jsonPayload += "\"battery\":" + String(battery) + ",";
    jsonPayload += "\"status\":\"" + String(status) + "\"";
    jsonPayload += "}";

    String data_cmd = "AT+HTTPDATA=" + String(jsonPayload.length()) + ",10000";
    if (expectResponse(sendATCommand(data_cmd.c_str(), 5000), "DOWNLOAD")) {
        sendATCommand(jsonPayload.c_str(), 10000); // Send the JSON data
    } else {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    sendATCommand("AT+HTTPACTION=1", 20000); // POST action
    sendATCommand("AT+HTTPTERM", 3000);
    
    Serial.println("Status update sent.");
}

void setup() {
    Serial.begin(9600);
    while (!Serial);

    if (!initializeSIM()) {
        Serial.println("\n[FATAL] SIM Initialization failed. Halting.");
        while (true);
    }
}

void loop() {
    if (!isGprsConnected()) {
        Serial.println("[WARNING] GPRS Disconnected. Re-initializing...");
        initializeSIM();
    } else {
        if (currentOrderId == "") {
            getMissionDetails();
        } else {
            // Simulate drone flying and updating status
            updateDroneStatus(19.1176, 72.9060, 85, "Delivering");
            delay(10000);
            updateDroneStatus(19.1200, 72.9080, 80, "Delivering");
            delay(10000);
            
            // Mark as delivered and clear order ID to look for a new mission
            updateDroneStatus(19.1234, 72.9100, 75, "Delivered");
            currentOrderId = ""; 
        }
    }
    
    Serial.println("\nWaiting 15 seconds before next action...");
    delay(15000); 
}
