#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> Arduino 10, RX -> Arduino 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; 
// IMPORTANT: Replace this with your actual public URL from ngrok or your server
const char* SERVER_URL = "http://<YOUR_NGROK_OR_PUBLIC_URL>"; 
const char* DRONE_ID = "SB-001";

// --- Global State ---
bool missionInProgress = false;
String currentOrderId = "";
float targetLatitude = 0.0;
float targetLongitude = 0.0;


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
    sendATCommand("AT+SAPBR=0,1", 3000); 
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


// --- GET Request Logic ---
void getMissionDetails() {
    Serial.println("\nChecking for a new mission...");
    
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    String get_url = String(SERVER_URL) + "/api/getMission?droneId=" + String(DRONE_ID);
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + get_url + "\"";
    
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    sendATCommand("AT+HTTPACTION=0", 2000);
    
    String actionResponse = "";
    unsigned long actionStart = millis();
    while(millis() - actionStart < 20000) {
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        if(line.startsWith("+HTTPACTION:")){ actionResponse = line; break; }
      }
    }

    if (actionResponse.indexOf("200") == -1) {
        Serial.println("[INFO] HTTP GET failed or no new mission.");
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    sendATCommand("AT+HTTPREAD", 10000);
    
    String jsonResponse = "";
    unsigned long readStart = millis();
    bool jsonStarted = false;
    while(millis() - readStart < 5000) {
      if(sim.available()) {
        char c = sim.read();
        if(c == '{') jsonStarted = true;
        if(jsonStarted) jsonResponse += c;
        if(c == '}' && jsonStarted) break;
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000);

    if (jsonResponse.length() > 2) { // Check if it's more than just "{}"
        DynamicJsonDocument doc(256);
        deserializeJson(doc, jsonResponse);

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            targetLatitude = doc["latitude"];
            targetLongitude = doc["longitude"];
            currentOrderId = doc["orderId"].as<String>();
            missionInProgress = true;

            Serial.println("\n--- NEW MISSION RECEIVED ---");
            Serial.print("Order ID: "); Serial.println(currentOrderId);
            Serial.print("Latitude: "); Serial.println(targetLatitude, 6);
            Serial.print("Longitude: "); Serial.println(targetLongitude, 6);
            Serial.println("--------------------------");
        }
    } else {
         Serial.println("[INFO] No mission available.");
    }
}

// --- POST Request Logic ---
void postDroneStatus(float lat, float lon, int battery, const char* status) {
    Serial.println("\nSending drone status update...");

    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;

    String post_url = String(SERVER_URL) + "/api/updateDroneStatus";
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + post_url + "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    // Set content type to JSON
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    // Prepare JSON data
    String jsonData = "{\"droneId\":\"" + String(DRONE_ID) + "\",";
    jsonData += "\"latitude\":" + String(lat, 6) + ",";
    jsonData += "\"longitude\":" + String(lon, 6) + ",";
    jsonData += "\"battery\":" + String(battery) + ",";
    jsonData += "\"status\":\"" + String(status) + "\"}";
    
    String data_cmd = "AT+HTTPDATA=" + String(jsonData.length()) + ",10000";
    if (expectResponse(sendATCommand(data_cmd.c_str(), 5000), "DOWNLOAD")) {
        // Now send the actual data
        sendATCommand(jsonData.c_str(), 10000);
    } else {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    // Perform POST action
    sendATCommand("AT+HTTPACTION=1", 2000); // 1 for POST

    String actionResponse = "";
    unsigned long actionStart = millis();
    while(millis() - actionStart < 20000) {
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        if(line.startsWith("+HTTPACTION:")){ actionResponse = line; break; }
      }
    }
    
    if (actionResponse.indexOf("200") == -1) {
        Serial.println("[ERROR] HTTP POST failed.");
    } else {
        Serial.println("[INFO] Status update sent successfully.");
    }

    sendATCommand("AT+HTTPTERM", 3000);
}


void setup() {
    Serial.begin(9600);
    while (!Serial);

    if (!initializeSIM()) {
        Serial.println("\n[FATAL] SIM Initialization failed. Halting.");
        while (true);
    }
    Serial.println("\nSystem Ready.");
}

void loop() {
    if (missionInProgress) {
        // If we have a mission, send status updates
        Serial.println("Executing mission for order: " + currentOrderId);
        // In a real drone, you would get actual GPS and battery data here.
        // We will simulate it for now.
        float currentLat = 19.1176; // Mock data
        float currentLon = 72.9060; // Mock data
        int batteryLevel = 85;      // Mock data
        
        postDroneStatus(currentLat, currentLon, batteryLevel, "Delivering");
        
        // After some time, you might reach the destination
        // For this example, we'll just complete the mission after one update
        missionInProgress = false; 
        currentOrderId = "";
        Serial.println("Mission complete. Returning to base.");
        postDroneStatus(currentLat, currentLon, batteryLevel - 5, "Idle");

    } else {
        // If no mission, check for a new one
        getMissionDetails();
    }

    Serial.println("\nWaiting for 30 seconds...");
    delay(30000); 
}
