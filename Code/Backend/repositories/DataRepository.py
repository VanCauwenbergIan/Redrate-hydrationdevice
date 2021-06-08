from .Database import Database


class DataRepository:
    @staticmethod
    def json_or_formdata(request):
        if request.content_type == 'application/json':
            gegevens = request.get_json()
        else:
            gegevens = request.form.to_dict()
        return gegevens

    @staticmethod
    def create_log(datumtijd, gemetenwaarde, status, note, deviceid, actieid):
        sql = "INSERT INTO historiek(datumtijd, gemetenwaarde, status, note, deviceid, actieid) VALUES(%s,%s,%s,%s,%s,%s)"
        params = [datumtijd, gemetenwaarde, status, note, deviceid, actieid]
        return Database.execute_sql(sql, params)

    @staticmethod
    def read_device_today(deviceid):
        sql = "SELECT * FROM historiek WHERE deviceid = %s ORDER BY datumtijd DESC LIMIT 1"
        params = [deviceid]
        return Database.get_one_row(sql, params)

    @staticmethod
    def read_device_today_all(deviceid):
        sql = f"SELECT * FROM historiek WHERE deviceid = {'%s'} AND DATE_FORMAT(datumtijd, '%Y-%m-%d') = CURDATE() ORDER BY datumtijd;"
        params = [deviceid]
        return Database.get_rows(sql, params)