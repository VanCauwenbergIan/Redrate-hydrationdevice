from .Database import Database

# this file handles the communication between the Backend and database


class DataRepository:
    # convert any received date to a dictionary readable by python
    @staticmethod
    def json_or_formdata(request):
        if request.content_type == 'application/json':
            gegevens = request.get_json()
        else:
            gegevens = request.form.to_dict()
        return gegevens

    # create a new log in the database
    @staticmethod
    def create_log(datumtijd, gemetenwaarde, status, note, deviceid, actieid):
        sql = "INSERT INTO historiek(datumtijd, gemetenwaarde, status, note, deviceid, actieid) VALUES(%s,%s,%s,%s,%s,%s)"
        params = [datumtijd, gemetenwaarde, status, note, deviceid, actieid]
        return Database.execute_sql(sql, params)

    # read the latest entry for the selected device
    @staticmethod
    def read_device_today(deviceid):
        sql = f"SELECT * FROM historiek WHERE deviceid = {'%s'} ORDER BY datumtijd DESC LIMIT 1"
        params = [deviceid]
        return Database.get_one_row(sql, params)

    # read all entries from today for the selected device
    @staticmethod
    def read_device_today_all(deviceid):
        sql = f"SELECT * FROM historiek WHERE deviceid = {'%s'} AND DATE_FORMAT(datumtijd, '%Y-%m-%d') = CURDATE() ORDER BY datumtijd;"
        params = [deviceid]
        return Database.get_rows(sql, params)

    # read all entries from the current week for the weight sensor
    @staticmethod
    def read_week():
        sql = "SELECT historiekid, dayofweek(datumtijd) AS `dag`, gemetenwaarde, note FROM historiek WHERE week(datumtijd, 7) = week(curdate(), 7) AND deviceid = 2;"
        return Database.get_rows(sql)
