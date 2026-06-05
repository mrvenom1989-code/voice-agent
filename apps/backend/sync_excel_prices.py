import pandas as pd
import json
import os
import re

# Determine paths relative to this script
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "data", "db.json")

# Try to locate the Excel file in the workspace root
possible_excel_paths = [
    os.path.join(script_dir, "..", "..", "Master Repair Price.xlsx"),
    os.path.join(script_dir, "..", "Master Repair Price.xlsx"),
    os.path.join(script_dir, "Master Repair Price.xlsx")
]

excel_path = None
for p in possible_excel_paths:
    if os.path.exists(p):
        excel_path = p
        break

if not excel_path:
    print("[Error] Could not locate 'Master Repair Price.xlsx' in possible locations:")
    for p in possible_excel_paths:
        print(f"   - {p}")
    exit(1)

print(f"[Info] Found Excel file at: {excel_path}")
print(f"[Info] Using database at: {db_path}")

def clean_price(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip().replace('$', '').replace(',', '')
    if val_str.lower() in ('nan', 'check', 'n/a', ''):
        return None
    try:
        if '.' in val_str:
            return float(val_str)
        return int(val_str)
    except ValueError:
        return val_str

repair_prices = []

# --- 1. APPLE ---
try:
    df_apple = pd.read_excel(excel_path, sheet_name="Apple")
    for _, row in df_apple.iterrows():
        model = row.get('Model')
        if pd.isna(model) or str(model).strip() == "" or "series" in str(model).lower():
            continue
        model = str(model).strip()
        
        # AQ7 (LCD Screen)
        aq7_price = clean_price(row.get('AQ7'))
        if aq7_price:
            repair_prices.append({
                "device": model,
                "issue": "LCD Screen Repair",
                "cost": aq7_price,
                "duration": "45 minutes"
            })
                
        # XO7 (OLED Screen)
        xo7_price = clean_price(row.get('XO7'))
        if xo7_price:
            repair_prices.append({
                "device": model,
                "issue": "OLED Screen Repair",
                "cost": xo7_price,
                "duration": "45 minutes"
            })

        # OEM Screen
        oem_price = clean_price(row.get('OEM Screen'))
        if oem_price:
            repair_prices.append({
                "device": model,
                "issue": "OEM Screen Repair",
                "cost": oem_price,
                "duration": "60 minutes"
            })

        # AM Battery
        am_bat_price = clean_price(row.get('AM Battery'))
        if am_bat_price:
            repair_prices.append({
                "device": model,
                "issue": "Aftermarket Battery Replacement",
                "cost": am_bat_price,
                "duration": "30 minutes"
            })

        # OEM Battery
        oem_bat_price = clean_price(row.get('OEM Battery'))
        if oem_bat_price:
            repair_prices.append({
                "device": model,
                "issue": "OEM Battery Replacement",
                "cost": oem_bat_price,
                "duration": "30 minutes"
            })

        # Charge Port
        cp_price = clean_price(row.get('Charge Port '))
        if cp_price:
            repair_prices.append({
                "device": model,
                "issue": "Charging Port Repair",
                "cost": cp_price,
                "duration": "45 minutes"
            })

        # Back Glass
        bg_price = clean_price(row.get('Back Glass'))
        if bg_price:
            repair_prices.append({
                "device": model,
                "issue": "Back Glass Replacement",
                "cost": bg_price,
                "duration": "45 minutes"
            })
except Exception as e:
    print(f"[Error] Error parsing Apple sheet: {e}")

# --- 2. SAMSUNG ---
try:
    df_samsung = pd.read_excel(excel_path, sheet_name="Samsung")
    for _, row in df_samsung.iterrows():
        model = row.iloc[0]
        if pd.isna(model) or str(model).strip() == "" or "series" in str(model).lower():
            continue
        model_str = str(model).strip()
        
        # Header skip check
        oled_val = str(row.get('OLED')).strip()
        if oled_val in ('Screen', 'OLED'):
            continue

        # Normalize Samsung models
        normalized_model = model_str
        if not (normalized_model.startswith("Samsung") or normalized_model.startswith("Galaxy")):
            if normalized_model.startswith("Fold") or normalized_model.startswith("Flip"):
                normalized_model = "Samsung Galaxy Z " + normalized_model
            else:
                normalized_model = "Samsung Galaxy " + normalized_model

        # OLED
        oled_price = clean_price(row.get('OLED'))
        if oled_price:
            repair_prices.append({
                "device": normalized_model,
                "issue": "OLED Screen Repair",
                "cost": oled_price,
                "duration": "60 minutes"
            })

        # OCTA
        octa_price = clean_price(row.get('OCTA'))
        if octa_price:
            repair_prices.append({
                "device": normalized_model,
                "issue": "AMOLED (OCTA) Screen Repair",
                "cost": octa_price,
                "duration": "60 minutes"
            })

        # Charge Port
        cp_price = clean_price(row.get('Charge Port'))
        if cp_price:
            repair_prices.append({
                "device": normalized_model,
                "issue": "Charging Port Repair",
                "cost": cp_price,
                "duration": "45 minutes"
            })

        # Battery
        bat_price = clean_price(row.get('Battery'))
        if bat_price:
            repair_prices.append({
                "device": normalized_model,
                "issue": "Battery Replacement",
                "cost": bat_price,
                "duration": "30 minutes"
            })

        # Back Glass
        bg_price = clean_price(row.get('Back Glass'))
        if bg_price:
            repair_prices.append({
                "device": normalized_model,
                "issue": "Back Glass Replacement",
                "cost": bg_price,
                "duration": "45 minutes"
            })
except Exception as e:
    print(f"[Error] Error parsing Samsung sheet: {e}")

# --- 3. GOOGLE ---
try:
    df_google = pd.read_excel(excel_path, sheet_name="Google ")
    for _, row in df_google.iterrows():
        model = row.get('Model')
        if pd.isna(model) or str(model).strip() == "" or "series" in str(model).lower():
            continue
        model_str = str(model).strip()
        
        # Normalize Google models
        normalized_model = model_str
        if not normalized_model.startswith("Google") and not normalized_model.startswith("Pixel"):
            normalized_model = "Google Pixel " + normalized_model
        elif normalized_model.startswith("Pixel"):
            normalized_model = "Google " + normalized_model

        # OEM Screen
        screen_val = row.get('OEM Screen')
        if not pd.isna(screen_val):
            screen_str = str(screen_val).strip()
            if "innie" in screen_str and "outie" in screen_str:
                # Parse double price like "$1099 innie / $289 outie"
                try:
                    prices_found = re.findall(r'\d+', screen_str.replace(',', ''))
                    if len(prices_found) >= 2:
                        inner_price = int(prices_found[0])
                        outer_price = int(prices_found[1])
                        repair_prices.append({
                            "device": normalized_model,
                            "issue": "OEM Screen Repair (Inner)",
                            "cost": inner_price,
                            "duration": "60 minutes"
                        })
                        repair_prices.append({
                            "device": normalized_model,
                            "issue": "OEM Screen Repair (Outer)",
                            "cost": outer_price,
                            "duration": "60 minutes"
                        })
                except Exception as e:
                    print(f"[Warning] Error parsing Google screen price string '{screen_str}': {e}")
            else:
                screen_price = clean_price(screen_val)
                if screen_price:
                    repair_prices.append({
                        "device": normalized_model,
                        "issue": "OEM Screen Repair",
                        "cost": screen_price,
                        "duration": "60 minutes"
                    })

        # Battery
        bat_price = clean_price(row.get('Battery'))
        if bat_price:
            repair_prices.append({
                "device": normalized_model,
                "issue": "Battery Replacement",
                "cost": bat_price,
                "duration": "30 minutes"
            })
except Exception as e:
    print(f"[Error] Error parsing Google sheet: {e}")

# --- 4. MERGE & WRITE TO DB.JSON ---
try:
    if not os.path.exists(db_path):
        print(f"[Error] Database file does not exist at: {db_path}")
        exit(1)
        
    with open(db_path, "r", encoding="utf-8") as f:
        db = json.load(f)
        
    # Overwrite repairPrices and clear partsInventory
    db["repairPrices"] = repair_prices
    db["partsInventory"] = []
    
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
        
    print(f"[Success] Successfully synchronized database! Integrated {len(repair_prices)} repair prices.")
except Exception as e:
    print(f"[Error] Failed to update database: {e}")
    exit(1)
