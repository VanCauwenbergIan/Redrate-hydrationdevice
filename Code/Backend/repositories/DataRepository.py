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
