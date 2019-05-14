import requests, json, csv
from bs4 import BeautifulSoup
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
data_bank = {}
CORS(app)


class City:
    def __init__(self, location, coordinates, category, one_br_rent):
        self.location = location
        self.coordinates = coordinates
        self.category = category
        self.one_br_rent = one_br_rent


def sort_by_price(data):
    sorted_prices = [data[0]]
    data.pop(0)
    for p in data:
        for n_p in sorted_prices:
            if p.one_br_rent > n_p.one_br_rent:
                sorted_prices.insert(sorted_prices.index(n_p), p)
                break
            if sorted_prices.index(n_p) == len(sorted_prices)-1:
                sorted_prices.append(p)
                break

    return sorted_prices


def finalize(data):
    national = ''
    states = []
    cities = []
    for d in data:
        if d.category == 'National':
            national = d.__dict__
        elif d.category == 'State':
            states.insert(0, d.__dict__)
        else:
            cities.insert(0, d.__dict__)

    return json.dumps({
        "national": national,
        "states": states,
        "cities": cities
    })


def scrape_rent():
    url = 'https://www.apartmentlist.com/rentonomics/national-rent-data/'
    response = requests.get(url)
    content = BeautifulSoup(response.content, "html.parser")

    raw_prices = []
    location_filter = content.find_all('td', attrs={'class': 'column-1'})
    type_filter = content.find_all('td', attrs={'class': 'column-2'})
    rent_filter = content.find_all('td', attrs={'class': 'column-3'})

    for i in range(0, len(rent_filter)):
        formatted_price = int(rent_filter[i].text.replace('$', '').replace(',', ''))
        coordinates = get_coordinates(location_filter[i].text)

        item = City(location_filter[i].text, coordinates, type_filter[i].text, formatted_price)
        raw_prices.append(item)

    return raw_prices


def get_coordinates(location):
    raw_coordinates = requests.get(
        'https://maps.googleapis.com/maps/api/geocode/json?address=' + location + '&key=AIzaSyCYy0DCdICQhFV06WZ77OUCq5bHUGe9YrQ')
    response = json.loads(raw_coordinates.text)
    geo = response['results'][0]['geometry']['location']

    return {
        'lat': geo['lat'],
        'long': geo['lng']
    }


def write_to_csv(data):

    with open('rent.csv', 'w') as csvfile:
        filewriter = csv.writer(csvfile, delimiter=',',
                                quotechar='"', quoting=csv.QUOTE_ALL, lineterminator='\n')
        filewriter.writerow(['Location', 'Lat', 'Long', 'Type', 'One BR Rent'])
        for d in data:
            filewriter.writerow([d.location, d.coordinates['lat'], d.coordinates['long'], d.category, d.one_br_rent])


def read_csv():
    data = []
    try:
        with open('rent.csv', 'r') as csvfile:
            reader = csv.reader(csvfile)

            iter_reader = iter(reader)
            next(iter_reader)
            for r in iter_reader:
                data.append(City(r[0], {'lat': r[1], 'long': r[2]}, r[3], r[4]))

        return data

    except FileNotFoundError:
        return None


@app.route('/rent', methods=['GET'])
def return_rent():
    return data_bank


if __name__ == '__main__':
    csv_data = read_csv()
    if csv_data is None:
        print("Scraping rent data...")
        raw_data = scrape_rent()
        sorted_prices = sort_by_price(raw_data)
        write_to_csv(sorted_prices)
        csv_data = read_csv()

    data_bank = finalize(csv_data)
    app.run()
