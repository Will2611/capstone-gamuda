import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

class GoogleSheetService:
    def __init__(self, creds_path="credentials.json"):
        self.creds = None
        self.service = None
        self.spreadsheet_id = "1L-dYiKnwRO1pEL9yk3uz0PyKhFo-x80_HTZzPwmsV9o" 
        
        if os.path.exists(creds_path):
            try:
                self.creds = service_account.Credentials.from_service_account_file(
                    creds_path,
                    scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                )
                self.service = build('sheets', 'v4', credentials=self.creds)
                print(" Successfully connected to Google Sheets API")
            except Exception as e:
                print(f" Failed to initialize Google Sheets service: {e}")
        else:
            print(f" WARNING: '{creds_path}' not found. Using fallback mock data for Google Sheets.")

    def get_sheet_data(self, spreadsheet_id, range_name):
        """基础读取函数"""
        if not self.service:
            return []
        try:
            sheet = self.service.spreadsheets()
            result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
            return result.get('values', [])
        except Exception as e:
            print(f"Error fetching sheet range {range_name}: {e}")
            return []

    def fetch_dashboard_sheet_data(self):
        """专门为 analytics 路由调用的高阶聚合方法"""
        
        default_menu = [
            {"name": "Truffle Burger", "units_sold": 420},
            {"name": "Craft Beer", "units_sold": 380},
            {"name": "Family Combo", "units_sold": 290},
            {"name": "Matcha Latte", "units_sold": 210},
        ]
        default_segments = [
            {"name": "Young Families", "customer_count": 45},
            {"name": "Weekend Foodies", "customer_count": 30},
            {"name": "Office Workers", "customer_count": 15},
            {"name": "Students", "customer_count": 10},
        ]
        default_financials = [
            {"name": "Young Families", "customer_count": 45},
            {"name": "Weekend Foodies", "customer_count": 30},
        ]

        if not self.service:
            return {
                "menu_items": default_menu,
                "customer_segments": default_segments,
                "financial_summary": default_financials
            }

        # ---------------------------------------------------------
        # 1. 尝试拉取 Menu Items
        # 💡 假设 Menu_Items 表也是：A=ID, B=Name, C=Units_Sold
        # ---------------------------------------------------------
        menu_items = []
        try:
            raw_menu = self.get_sheet_data(self.spreadsheet_id, "'Menu_Items'!A2:H5")
            for row in raw_menu:
                if str(row[6]).isdigit():
                    menu_items.append({
                        "name": str(row[1]),           # 'Truffle Burger'
                        "units_sold": int(row[6])       # 1000
                    })
                # Fallback: handle cases where the sheet only has 2 columns (Name, Units Sold)
                elif str(row[1]).isdigit():
                    menu_items.append({
                        "name": str(row[0]), 
                        "units_sold": int(row[1])
                    })

                # 兼容：如果只有2列(B=Name, C=Units) 或是3列(A=ID, B=Name, C=Units)
                # if len(row) >= 3 and str(row[2]).isdigit():
                #     menu_items.append({"name": str(row[1]), "units_sold": int(row[2])})
                # elif len(row) >= 2 and str(row[1]).isdigit():
                #     menu_items.append({"name": str(row[0]), "units_sold": int(row[1])})
        except Exception as e:
            print(f"Error reading Menu_Items tab: {e}")

        customer_segments = []
        try:
            raw_segments = self.get_sheet_data(self.spreadsheet_id, "'Customer_Segments'!A2:C10")
            for row in raw_segments:
                if len(row) >= 3 and str(row[2]).isdigit():
                    # row[1] 是 Segment_Name ("Weekend Foodies")
                    # row[2] 是 Customer_Count (497)
                    customer_segments.append({
                        "name": str(row[1]), 
                        "customer_count": int(row[2])
                    })
        except Exception as e:
            print(f"Error reading Customer Segments tab: {e}")

        # 3. 组装返回数据（若读取为空则优雅降级为 default）
        return {
            "menu_items": menu_items if menu_items else default_menu,
            "customer_segments": customer_segments if customer_segments else default_segments,
            "financial_summary": default_financials
        }
    

# 单例实例化
sheet_service = GoogleSheetService()