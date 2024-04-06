let map, directionsService, directionsRenderer, startButtonDiv, infoWindow;
const originInput = document.getElementById("origin");
const destinationInput = document.getElementById("destination");
const button = document.getElementById("routeButton");

// ENVIA OS VALORES DO INPUT APERTANDO A TECLA ENTER OU CLICANDO NO BOTAO ( É POSSIVEL VISUALIZAR OS DADOS ENVIADOS NO CONSOLE ) 
// ALEM DISSO ELE VERIFICA SE OS INPUTS CONTEM ALGUM CONTEÚDO, CASO ESTEJA VAZIO EMITE UM ALERTA

document.addEventListener("keyup", function (event) {

  if (event.key === "Enter") {
    if (originInput.value.trim() === "" || destinationInput.value.trim() === "") {
      alert("Por favor, preencha todos os campos.");
    }
  }
});

button.addEventListener("click", function () {

  if (originInput.value.trim() === "" || destinationInput.value.trim() === "") {
    alert("Por favor, preencha todos os campos.");
  }
});

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -22.4740, lng: -45.6133 },
    zoom: 16,
    disableDefaultUI: true
  });

  fetch('js/mapStyle.json')
    .then(response => response.json())
    .then(mapStyle => map.setOptions({ styles: mapStyle }));

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
  startButtonDiv = document.getElementById("startButtonDiv");

  const options = { componentRestrictions: { country: 'BR' } };

  GoogleMapOptions optionsMap = new GoogleMapOptions();
  optionsMap.compassEnabled(true);


  new google.maps.places.Autocomplete(originInput, options);
  new google.maps.places.Autocomplete(destinationInput, options);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Sua Localização',
        animation: google.maps.Animation.BOUNCE,
        icon: { url: 'images/location.png', scaledSize: new google.maps.Size(40, 40) }
      });
      map.setCenter(userLocation);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ 'location': userLocation }, results => {
        if (results[0]) originInput.value = results[0].formatted_address;
      });

      const mapClickHandler = e => {
        const clickPosition = e.latLng;
        const selectedInput = document.querySelector('.selected');
        geocoder.geocode({ 'location': clickPosition }, results => {
          if (results[0]) selectedInput.value = results[0].formatted_address;
        });
      };

      [originInput, destinationInput].forEach(input => {
        input.addEventListener('focus', () => {
          [originInput, destinationInput].forEach(input => input.classList.remove('selected'));
          input.classList.add('selected');
          map.addListener('click', mapClickHandler);
        });
      });

      document.addEventListener('click', event => {
        if (!event.target.closest('#origin, #destination')) {
          [originInput, destinationInput].forEach(input => input.classList.remove('selected'));
          map.removeListener('click', mapClickHandler);
        }
      });
    }, () => handleLocationError(true, infoWindow, map.getCenter()));
  }
}

function setupChoiceInButton() {
  const choiceInButton = document.getElementById('choiceIn');
  let isActive = false;

  choiceInButton.addEventListener('click', () => {
    choiceInButton.classList.toggle('Active', isActive);
    choiceInButton.textContent = isActive ? 'Escolher no Mapa' : 'Remover';
    if (isActive) {
      deactivateChoiceInMap();
    } else {
      choiceInMap();
    }
    isActive = !isActive;
  });
}

function choiceInMap() {
  if (!document.querySelector('.mapPointer')) {
    const centerControlDiv = document.createElement('div');
    const centerControl = new CenterControl(centerControlDiv, map);
    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.CENTER].push(centerControlDiv);
  }
  google.maps.event.addListener(map, 'center_changed', () => {
    const center = map.getCenter();
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: center }, results => {
      const result = results[0];
      if (result) {
        const selectedInput = document.querySelector('.selected');
        if (selectedInput === originInput) originInput.value = result.formatted_address;
        else if (selectedInput === destinationInput) destinationInput.value = result.formatted_address;
      }
    });
  });
}

function deactivateChoiceInMap() {
  google.maps.event.clearListeners(map, 'click');
  const mapPointerDiv = document.querySelector('.mapPointer');
  if (mapPointerDiv) mapPointerDiv.remove();
}

function CenterControl(controlDiv, map) {
  controlDiv.className = 'mapPointer';
  controlDiv.title = 'Center Map';
  controlDiv.innerHTML = '';
}

function showRoute() {

  const { value: origin } = originInput;
  const { value: destination } = destinationInput;

  const request = { origin, destination, travelMode: "DRIVING" };

  directionsService.route(request, (response, status) => {
    if (status === "OK") {
      const route = response.routes[0];
      const { text: distance } = route.legs[0].distance;
      const { text: duration } = route.legs[0].duration;
      const distanceValue = route.legs[0].distance.value;
      const valorKm = 0.80;
      const fixedValue = 5;

      directionsRenderer.setDirections(response);
      document.getElementById("botoes").style.display = "none";
      startButtonDiv.style.display = "block";
      originInput.style.display = "none";
      destinationInput.style.display = "none";
      document.getElementById("i-boxTitle").textContent = "Confirme as Informações da sua Viagem";
      document.getElementById("infoBox").style.display = "block";

      displayRouteInfo(distance, duration, distanceValue, valorKm, fixedValue);
    } else {
      window.alert("Erro ao obter direções! Status: " + status);
    }
  });
}

function displayRouteInfo(distance, duration, distanceValue, valorKm, fixedValue) {
  const infoDistance = document.getElementById("infoDistance");
  const infoTime = document.getElementById("infoTime");
  const infoPrice = document.getElementById("infoPrice");

  infoDistance.textContent = "Distância: " + distance;
  infoTime.textContent = "Duração: " + duration;

  const price = parseFloat(distanceValue / 1000 * valorKm + fixedValue).toFixed(2);
  infoPrice.textContent = "Valor da Corrida: R$" + price;
}

setupChoiceInButton();

function startNavigation() {

  const origin = document.getElementById("origin").value;
  const destination = document.getElementById("destination").value;

  // Aqui enviará os Dados da corrida para o BackEnd
  // Iniciará o mapa de acompanhamento da Pessoa que fez pedido da corrida

  // window.open("https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(origin) + "&destination=" + encodeURIComponent(destination) + "&travelmode=driving", "_blank");
}

// FUNCIONAL DO MENU HAMBURGUER

class MobileNavbar {
  constructor(mobileMenu, navList, navLinks) {
    this.mobileMenu = document.querySelector(mobileMenu);
    this.navList = document.querySelector(navList);
    this.navLinks = document.querySelectorAll(navLinks);
    this.activeClass = "active";

    this.handleClick = this.handleClick.bind(this);
  }

  animateLinks() {
    this.navLinks.forEach((link, index) => {
      link.style.animation
        ? (link.style.animation = "")
        : (link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3
          }s`);
    });
  }

  handleClick() {
    this.navList.classList.toggle(this.activeClass);
    this.mobileMenu.classList.toggle(this.activeClass);
    this.animateLinks();
  }

  addClickEvent() {
    this.mobileMenu.addEventListener("click", this.handleClick);
  }

  init() {
    if (this.mobileMenu) {
      this.addClickEvent();
    }
    return this;
  }
}

const mobileNavbar = new MobileNavbar(
  ".mobile-menu",
  ".nav-list",
  ".nav-list li",
);
mobileNavbar.init();
