# Buckett roadmap

## Productdoel
Buckett is bedoeld als een snelle en praktische beheeromgeving voor projectbestanden en beeldmateriaal. De focus ligt op gebruiksgemak, overzicht, snelheid en eenvoudige self-hosting.

## Huidige status
De basis van Buckett staat nu stevig:

- project- en mapbeheer
- directe uploads
- previews en downloads
- URL kopiëren
- activiteitsoverzicht
- Docker en Dockge deployment

## Wensenlijst en aankomende uitbreidingen

### 1. Externe back-up integraties
Buckett moet in de toekomst back-ups kunnen wegschrijven naar externe diensten. Denk aan Amazon, Google Drive, Dropbox en vergelijkbare opslagproviders. Het doel is dat een beheerder eenvoudig een extra back-uplaag kan toevoegen zodat bestanden niet alleen lokaal op de server staan.

Belangrijke wens hierbij is een simpele configuratie, periodieke back-ups en duidelijke statusinformatie over het slagen van de back-up.

### 2. Extra opslag via externe schijven of cloud-opslag
Op termijn moet het mogelijk worden om de beschikbare opslagcapaciteit uit te breiden via andere bronnen. Denk aan SMB, NFS, externe disks of bijvoorbeeld Amazon S3-achtige opslag.

Hiermee kan Buckett ook op kleinere servers blijven draaien terwijl de feitelijke bestandsopslag elders wordt ondergebracht.

### 3. Configuratie exporteren
Er moet een mogelijkheid komen om instellingen en configuratie te exporteren. Dat maakt verhuizing naar een andere server eenvoudiger en versnelt herstel bij problemen.

Deze export zou idealiter zaken bevatten zoals projecten, gebruikersinstellingen, uploadinstellingen en andere relevante systeemconfiguratie.

### 4. Client-side projectpagina per klant
Een grote toekomstige uitbreiding is een aparte klantpagina per project. Daarmee kan per project een eenvoudige deelpagina worden gegenereerd.

Gewenste werking:

- per project kan een link worden gegenereerd
- de klant ziet duidelijke mappenstructuren
- bij openen van een map worden bestanden en kleine thumbnails zichtbaar
- bij hover of klik kan een bestand groot worden ge-previewd
- bestanden kunnen direct worden gedownload
- complete mappen kunnen ook worden gedownload
- toegang verloopt via een eenvoudig wachtwoord per projectpagina

Dit is nadrukkelijk bedoeld als een lichte, praktische portal voor klanten die bestanden moeten bekijken of ophalen.

### 5. Veiliger Buckett-systeem als daar behoefte aan is
Buckett gebruikt nu bewust een eenvoudige loginstructuur. Als de wens ontstaat om zwaardere beveiliging toe te voegen, dan kan dit later worden uitgebreid.

Denk dan aan:

- sterkere authenticatie
- betere sessiebeveiliging
- uitgebreider rechtenbeheer
- veiligere deployment-adviezen
- extra bescherming voor gedeelde of publieke projectlinks

## Richting voor volgende versies
Voor de eerstvolgende ontwikkelfase ligt de nadruk vooral op afronding van gebruiksgemak, beheerfuncties en deployment-stabiliteit. Daarna kan Buckett doorgroeien naar een breder platform met delen, back-ups en flexibelere opslag.
