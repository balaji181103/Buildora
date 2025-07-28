#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 
// IMPORTANT: Replace the URL below with the one from your ngrok terminal.
const char* SERVER_URL = "http://9f3a-103-212-12-5.ngrok-free.app"; 

// --- Global Variables ---
// These will be updated by getMissionDetails()
char currentOrderId[21] = "None";
float targetLatitude = 0.0;
float targetLongitude = 0.0;
bool missionActive = false;

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

// --- Core Functions ---
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
    sendATCommand("AT+SAPBR=0,1", 3000); // Close bearer first
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
    String response = sendATCommand("AT+SAPBR=2,1", 3000);
    if (response.indexOf("+SAPBR: 1,1") != -1) {
        return true;
    }
    Serial.println("[INFO] GPRS connection lost.");
    return false;
}

void getMissionDetails() {
    Serial.println("\nRequesting new mission details...");
    
    String get_url = String(SERVER_URL) + "/api/getMission?droneId=SB-001";

    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + get_url + "\"";
    Serial.println("Requesting: " + get_url);
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    sendATCommand("AT+HTTPACTION=0", 2000);
    
    String actionResponse;
    unsigned long actionStart = millis();
    while(millis() - actionStart < 20000) {
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        Serial.println(line);
        if(line.startsWith("+HTTPACTION:")){ actionResponse = line; break; }
      }
    }

    if (actionResponse.indexOf("200") == -1) {
        Serial.println("[ERROR] HTTP GET failed.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    Serial.println("HTTP GET Success. Reading response...");
    sendATCommand("AT+HTTPREAD", 10000);
    
    String jsonResponse = "";
    unsigned long readStart = millis();
    bool jsonStarted = false;
    while(millis() - readStart < 5000) {
      if(sim.available()) {
        char c = sim.read();
        Serial.write(c);
        if(c == '{') jsonStarted = true;
        if(jsonStarted) jsonResponse += c;
        if(c == '}' && jsonStarted) break;
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000);

    if (jsonResponse.length() > 0 && jsonResponse.indexOf('{') != -1) {
        DynamicJsonDocument doc(256);
        deserializeJson(doc, jsonResponse);

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            targetLatitude = doc["latitude"];
            targetLongitude = doc["longitude"];
            strncpy(currentOrderId, doc["orderId"], 20);
            currentOrderId[20] = '\0'; // Null-terminate
            missionActive = true;

            Serial.println("\n--- NEW MISSION ACQUIRED ---");
            Serial.print("Order ID: "); Serial.println(currentOrderId);
            Serial.print("Latitude: "); Serial.println(targetLatitude, 6);
            Serial.print("Longitude: "); Serial.println(targetLongitude, 6);
            Serial.println("----------------------------");
        } else {
            Serial.println("[INFO] No active missions found.");
            missionActive = false;
        }
    } else {
        Serial.println("[INFO] No mission data in response.");
        missionActive = false;
    }
}

void updateDroneStatus(float lat, float lon, int battery, const char* status) {
    Serial.println("\nUpdating drone status...");

    String post_url = String(SERVER_URL) + "/api/updateDroneStatus";
    String post_data = "{\"droneId\":\"SB-001\",\"latitude\":" + String(lat, 6) + ",\"longitude\":" + String(lon, 6) + ",\"battery\":" + String(battery) + ",\"status\":\"" + String(status) + "\"}";
    
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + post_url + "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) { sendATCommand("AT+HTTPTERM", 3000); return; }

    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) { sendATCommand("AT+HTTPTERM", 3000); return; }

    String data_cmd = "AT+HTTPDATA=" + String(post_data.length()) + ",10000";
    if (!expectResponse(sendATCommand(data_cmd.c_str(), 2000), "DOWNLOAD")) { sendATCommand("AT+HTTPTERM", 3000); return; }
    
    Serial.println("Sending data: " + post_data);
    sim.println(post_data);
    delay(10000); // Wait for the data to be sent and acknowledged

    sendATCommand("AT+HTTPACTION=1", 2000);

    String actionResponse;
    unsigned long actionStart = millis();
    while(millis() - actionStart < 20000) {
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        Serial.println(line);
        if(line.startsWith("+HTTPACTION:")){ actionResponse = line; break; }
      }
    }

    if (actionResponse.indexOf("200") == -1) {
        Serial.println("[ERROR] HTTP POST failed.");
    } else {
        Serial.println("HTTP POST Success.");
    }

    sendATCommand("AT+HTTPTERM", 3000);
}


// --- Arduino Standard Functions ---
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
        Serial.println("Re-initializing GPRS...");
        initializeSIM();
        delay(5000);
        return; 
    }

    if (missionActive) {
        // Simulate drone flying and updating status
        Serial.println("\nMission is active. Simulating flight...");
        // In a real drone, you'd get these values from a GPS module
        float currentLat = 19.1176; 
        float currentLon = 72.9060;
        int battery = 85;
        updateDroneStatus(currentLat, currentLon, battery, "Delivering");
        
        // Check if destination is reached (simplified)
        if (abs(currentLat - targetLatitude) < 0.0001 && abs(currentLon - targetLongitude) < 0.0001) {
            Serial.println("Destination reached!");
            updateDroneStatus(currentLat, currentLon, 80, "Idle");
            missionActive = false; // End mission
        }
    } else {
        Serial.println("\nNo active mission. Checking server for new mission.");
        getMissionDetails();
    }

    Serial.println("\nWaiting 30 seconds before next action...");
    delay(30000); 
}
