#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> 10, RX <- 11

// --- Configuration ---
// Use the HTTPS URL provided by ngrok.
const char* APN = "airtelgprs.com";
const char* SERVER_URL = "https://<your-ngrok-url>.ngrok-free.app/api/getMission?droneId=SB-001"; // <-- IMPORTANT: Use https and update your URL

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
    if (!expectResponse(sendATCommand("AT+SAPBR=2,1", 5000), "OK")) {
        Serial.println("[ERROR] Failed to get an IP address.");
        return false;
    }

    Serial.println("GPRS connection is ready.");
    return true;
}

void getMissionDetails() {
    Serial.println("\nRequesting new mission details...");
    
    // --- Initialize HTTP and SSL ---
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) return;
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) return;
    
    // Enable SSL for HTTPS
    if (!expectResponse(sendATCommand("AT+HTTPSSL=1", 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }
    
    // --- Set URL ---
    String url_cmd = "AT+HTTPPARA=\"URL\",\"";
    url_cmd += SERVER_URL;
    url_cmd += "\"";
    Serial.println("Requesting: " + String(SERVER_URL));
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        sendATCommand("AT+HTTPTERM", 3000);
        return;
    }

    // --- Perform GET Action ---
    sendATCommand("AT+HTTPACTION=0", 2000); // Send command but don't wait for final response here
    
    String actionResponse = "";
    unsigned long actionStart = millis();
    bool actionComplete = false;
    while(millis() - actionStart < 20000) { // 20 second timeout for the action
      if(sim.available()){
        String line = sim.readStringUntil('\n');
        Serial.println(line);
        if(line.startsWith("+HTTPACTION:")){
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
        if(c == '}' && jsonStarted) break;
      }
    }
    
    sendATCommand("AT+HTTPTERM", 3000); // Terminate HTTP session

    Serial.println("\nExtracted JSON: " + jsonResponse);

    if (jsonResponse.length() > 0) {
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
        } else {
            Serial.println("[INFO] Server response did not contain mission details.");
        }
    } else {
        Serial.println("[ERROR] No JSON object found in HTTP response.");
    }
}


// --- Arduino Standard Functions ---
void setup() {
    Serial.begin(9600);
    while (!Serial); // Wait for serial monitor to open

    if (initializeSIM()) {
        Serial.println("\nSystem Ready.");
    } else {
        Serial.println("\n[FATAL] SIM Initialization failed. Halting.");
        while (true); // Halt system
    }
}

void loop() {
    getMissionDetails();
    Serial.println("\nWaiting 30 seconds before next request...");
    delay(30000); 
}
