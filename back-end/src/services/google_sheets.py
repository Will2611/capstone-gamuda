import os
import re
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

    def _clean_number(self, val):
        """清理字符串中的 $, %, 逗号并转为 float"""
        if not val:
            return 0.0
        cleaned = re.sub(r'[^\d.-]', '', str(val))
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

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
            {
                "month_year": "2026-05",
                "total_revenue": 42500.0,
                "cogs": 17000.0,
                "operating_expenses": 16150.0,
                "net_profit": 9350.0,
                "profit_margin": 22.0,
                "total_customers": 1310,
                "aov": 32.44
            },
            {
                "month_year": "2026-06",
                "total_revenue": 46800.0,
                "cogs": 18720.0,
                "operating_expenses": 17316.0,
                "net_profit": 10764.0,
                "profit_margin": 23.0,
                "total_customers": 1380,
                "aov": 33.91
            },
            {
                "month_year": "2026-07",
                "total_revenue": 49700.0,
                "cogs": 19880.0,
                "operating_expenses": 18637.5,
                "net_profit": 11182.5,
                "profit_margin": 22.5,
                "total_customers": 1420,
                "aov": 35.00
            }
        ]

        if not self.service:
            return {
                "menu_items": default_menu,
                "customer_segments": default_segments,
                "financial_summary": default_financials
            }

        # 1. 尝试拉取 Menu Items
        menu_items = []
        try:
            raw_menu = self.get_sheet_data(self.spreadsheet_id, "'Menu_Items'!A2:H1000")
            for row in raw_menu:
                if len(row) > 6 and str(row[6]).isdigit():
                    menu_items.append({"name": str(row[1]), "units_sold": int(row[6])})
                elif len(row) > 1 and str(row[1]).isdigit():
                    menu_items.append({"name": str(row[0]), "units_sold": int(row[1])})
        except Exception as e:
            print(f"Error reading Menu_Items tab: {e}")

        # 2. 尝试拉取 Customer Segments
        customer_segments = []
        try:
            raw_segments = self.get_sheet_data(self.spreadsheet_id, "'Customer_Segments'!A2:C10")
            for row in raw_segments:
                if len(row) >= 3 and str(row[2]).isdigit():
                    customer_segments.append({"name": str(row[1]), "customer_count": int(row[2])})
        except Exception as e:
            print(f"Error reading Customer Segments tab: {e}")

        # 3. 尝试拉取 Financial_Summary
        financial_summary = []
        try:
            # 假设表头在 A1:H1, 数据在 A2:H100
            raw_fin = self.get_sheet_data(self.spreadsheet_id, "'Financial_Summary'!A2:H100")
            for row in raw_fin:
                if len(row) >= 8:
                    financial_summary.append({
                        "month_year": str(row[0]).strip(),
                        "total_revenue": self._clean_number(row[1]),
                        "cogs": self._clean_number(row[2]),
                        "operating_expenses": self._clean_number(row[3]),
                        "net_profit": self._clean_number(row[4]),
                        "profit_margin": self._clean_number(row[5]),
                        "total_customers": int(self._clean_number(row[6])),
                        "aov": self._clean_number(row[7])
                    })
        except Exception as e:
            print(f"Error reading Financial_Summary tab: {e}")

        return {
            "menu_items": menu_items if menu_items else default_menu,
            "customer_segments": customer_segments if customer_segments else default_segments,
            "financial_summary": financial_summary if financial_summary else default_financials
        }

# 单例实例化
sheet_service = GoogleSheetService()