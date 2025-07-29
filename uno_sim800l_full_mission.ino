#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// --- Pin Definitions ---
SoftwareSerial sim(10, 11); // SIM800L TX -> Arduino 10, RX <- Arduino 11

// --- Configuration ---
const char* APN = "airtelgprs.com"; // Your Access Point Name
const char* SERVER_URL = "http://7f8e8b835319.ngrok-free.app"; // Your ngrok HTTP URL

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

// Function to open the GPRS bearer connection
bool openGPRS() {
    Serial.println("Opening GPRS bearer...");
    
    // Close any previous connections
    sendATCommand("AT+CIPSHUT", 3000);
    delay(1000);

    // Set connection type to GPRS
    if (!expectResponse(sendATCommand("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", 3000), "OK")) return false;

    // Set the APN
    String cmd = "AT+SAPBR=3,1,\"APN\",\"";
    cmd += APN;
    cmd += "\"";
    if (!expectResponse(sendATCommand(cmd.c_str(), 3000), "OK")) return false;
    
    // Set a reliable DNS server (Google's)
    if (!expectResponse(sendATCommand("AT+CDNSCFG=\"8.8.8.8\"", 3000), "OK")) return false;

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

// Function to close the GPRS bearer
void closeGPRS() {
    Serial.println("Closing GPRS and HTTP sessions.");
    sendATCommand("AT+HTTPTERM", 3000);
    sendATCommand("AT+SAPBR=0,1", 3000);
}


void getMissionDetails() {
    Serial.println("\n--- Starting Mission Request ---");
    
    if (!openGPRS()) {
        Serial.println("[ERROR] Could not open GPRS connection. Aborting mission request.");
        return;
    }

    // --- Initialize HTTP ---
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) {
        closeGPRS();
        return;
    }
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) {
        closeGPRS();
        return;
    }
    
    // --- Set URL ---
    String get_url = String(SERVER_URL) + "/api/getMission?droneId=SB-001";
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + get_url + "\"";
    Serial.println("Requesting: " + get_url);
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) {
        closeGPRS();
        return;
    }

    // --- Perform GET Action ---
    String actionResponse = sendATCommand("AT+HTTPACTION=0", 20000); // Increased timeout
    if (actionResponse.indexOf("+HTTPACTION: 0,200,") == -1) {
        Serial.println("[ERROR] HTTP GET failed. Check server URL and network.");
        closeGPRS();
        return;
    }
    
    Serial.println("HTTP GET Success. Reading response...");

    // --- Read Data ---
    String readResponse = sendATCommand("AT+HTTPREAD", 10000); // This command returns the data
    
    // --- Extract JSON from the response ---
    int jsonStartIndex = readResponse.indexOf('{');
    int jsonEndIndex = readResponse.lastIndexOf('}');
    String jsonString = "";

    if (jsonStartIndex != -1 && jsonEndIndex != -1) {
        jsonString = readResponse.substring(jsonStartIndex, jsonEndIndex + 1);
        Serial.println("\nExtracted JSON: " + jsonString);
    } else {
        Serial.println("[ERROR] No JSON object found in HTTP response.");
        closeGPRS();
        return;
    }

    closeGPRS(); // Done with the request, so close the connection.

    // --- Parse JSON and Print Details ---
    if (jsonString.length() > 0) {
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, jsonString);

        if (error) {
            Serial.print("[ERROR] JSON Parse Failed: ");
            Serial.println(error.c_str());
            return;
        }

        if (doc.containsKey("latitude") && doc.containsKey("longitude")) {
            float latitude = doc["latitude"];
            float longitude = doc["longitude"];
            const char* orderId = doc["orderId"];

            Serial.println("\n--- Mission Details Received ---");
            Serial.print("Order ID: ");
            Serial.println(orderId);
            Serial.print("Latitude: ");
            Serial.println(latitude, 6);
            Serial.print("Longitude: ");
            Serial.println(longitude, 6);
            Serial.println("--------------------------------");
            
            // Here you would start the drone's flight logic
            // For now, we simulate work and then update status
            delay(10000); // Simulate flying
            updateDroneStatus("Delivering", latitude, longitude, 85); // Example update
            
        } else {
            Serial.println("[INFO] No mission available from server.");
        }
    }
}


void updateDroneStatus(String status, float lat, float lon, int battery) {
    Serial.println("\n--- Starting Status Update ---");

    if (!openGPRS()) {
        Serial.println("[ERROR] Could not open GPRS for status update.");
        return;
    }

    // --- Prepare JSON Data ---
    StaticJsonDocument<200> doc;
    doc["droneId"] = "SB-001";
    doc["latitude"] = lat;
    doc["longitude"] = lon;
    doc["battery"] = battery;
    doc["status"] = status;

    String jsonData;
    serializeJson(doc, jsonData);
    int jsonLength = jsonData.length();

    // --- Initialize HTTP for POST ---
    if (!expectResponse(sendATCommand("AT+HTTPINIT", 5000), "OK")) { closeGPRS(); return; }
    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CID\",1", 5000), "OK")) { closeGPRS(); return; }

    String post_url = String(SERVER_URL) + "/api/updateDroneStatus";
    String url_cmd = "AT+HTTPPARA=\"URL\",\"" + post_url + "\"";
    if (!expectResponse(sendATCommand(url_cmd.c_str(), 5000), "OK")) { closeGPRS(); return; }

    if (!expectResponse(sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 5000), "OK")) { closeGPRS(); return; }

    // --- Send Data ---
    String httpDataCmd = "AT+HTTPDATA=" + String(jsonLength) + ",10000"; // Length and 10s timeout
    if (!expectResponse(sendATCommand(httpDataCmd.c_str(), 5000), "DOWNLOAD")) {
        Serial.println("[ERROR] Failed to prepare for data send.");
        closeGPRS();
        return;
    }
    
    // Send the actual JSON data
    String dataResponse = sendATCommand(jsonData.c_str(), 10000);
    if (!expectResponse(dataResponse, "OK")) {
        Serial.println("[ERROR] Failed to send JSON data.");
        closeGPRS();
        return;
    }

    // --- Perform POST Action ---
    String actionResponse = sendATCommand("AT+HTTPACTION=1", 20000); // POST action
    if (actionResponse.indexOf("+HTTPACTION: 1,200,") == -1) {
        Serial.println("[ERROR] HTTP POST failed.");
    } else {
        Serial.println("HTTP POST Success.");
        String readResponse = sendATCommand("AT+HTTPREAD", 10000);
        Serial.println("Server Response: " + readResponse);
    }

    closeGPRS();
}


// --- Arduino Standard Functions ---
void setup() {
    Serial.begin(9600);
    while (!Serial); // Wait for serial monitor to open

    sim.begin(9600);
    delay(1000);

    Serial.println("--- Initializing SIM Module ---");
    if (!expectResponse(sendATCommand("AT", 2000), "OK")) {
        Serial.println("[FATAL] Module not responding. Check connections and power.");
        while(true);
    }
    
    sendATCommand("ATE0", 2000); // Disable command echo

    Serial.println("Checking network registration...");
    String cpin_response = sendATCommand("AT+CPIN?", 5000);
    if(cpin_response.indexOf("READY") == -1){
        Serial.println("[FATAL] SIM card not ready. Please check SIM.");
        while(true);
    }

    String creg_response = sendATCommand("AT+CREG?", 5000);
    if(creg_response.indexOf("+CREG: 0,1") == -1 && creg_response.indexOf("+CREG: 0,5") == -1) {
        Serial.println("[FATAL] Not registered on network.");
        while(true);
    }
    
    Serial.println("--- System Initialized Successfully ---");
}

void loop() {
    getMissionDetails();
    Serial.println("\n======= Loop Complete. Waiting 30 seconds. =======");
    delay(30000); 
}
