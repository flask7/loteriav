import { Component } from '@angular/core';
import * as CryptoJS from 'crypto-js'
import { Platform, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ComunicacionService } from './comunicacion.service';
import * as moment from 'moment';
import { MenuController, AlertController } from '@ionic/angular';
import { Numeros } from './numeros';
import { Deeplinks } from '@ionic-native/deeplinks/ngx';
import { CambioPage } from './recuperar/cambio/cambio.page';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {

  user: string;
  hour: any;
  minute: any;
  second: any;
  tiempo: any = [];
  numeros = new Numeros();

  constructor(public nav: NavController, private service: ComunicacionService, public menuCtrl: MenuController, public alertController: AlertController, private deeplinks: Deeplinks) { 

    this.menuCtrl.toggle(); 

    this.deeplinks.route({

       '/recuperar': CambioPage

     }).subscribe(match => {

       this.nav.navigateForward('/recuperar/cambio');
       
       console.log('Ruta encontrada', match);

     }, nomatch => {
     
       console.error('Tengo un deeplink que no \' encontré', nomatch);

   });

  }

  async error(problema) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Error:',
      subHeader: '',
      message: problema,
      buttons: ['OK']
    });

    await alert.present();
  }

  async alerta(alerta) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Advertencia:',
      subHeader: '',
      message: alerta,
      buttons: ['OK']
    });

    await alert.present();
  }

  logout() {

    localStorage.clear();
    this.nav.navigateRoot('home');

  }

  ngOnInit(){

    this.reloj();
    this.service.data$.subscribe(res => this.user = res);

    if (localStorage.getItem('numeros') == '' || localStorage.getItem('numeros') == undefined || localStorage.getItem('fechas') == '' || localStorage.getItem('fechas') == undefined) {
     
      this.scrapping3();
   
    }

    let horaClick = moment(localStorage.getItem('horaClick'));
    let hora = moment();
    let pm8 = moment(moment().format('YYYY-MM-DD 20:00'));
    let pm8p1 = moment(moment().format('YYYY-MM-DD 20:00')).add(1,'day');
    let diff = (pm8p1.diff(hora,'seconds'))/3600;
    let diff2 = hora.diff(horaClick,'seconds')/3600;

    if (diff2 > 24) { // si la diferencia entre la hora actual y la ultima vez que se hizo clic es mayor a 24 horas, directamente se borra el contador
      
      localStorage.removeItem('contador');

    }else{

      if (diff >= 24) { // si la diferencia entre la hora actual y mañana es mayor a 24 se empieza a contar desde el día anterior a las 20:00 hasta hoy a las 20:00

        let d = pm8.diff(horaClick,'seconds')/3600;

        if (d > 24) {
          console.log('borrar contador')
          localStorage.removeItem('contador');
        }
        
        console.log('desde el dia anterior', d);
        
      }else{ // en caso contrario se cuenta a partir de hoy a las 20:00 hasta mañana a las 20:00

        let d = pm8p1.diff(horaClick,'seconds')/3600;

        if (d > 24) {
          console.log('borrar contador')
          localStorage.removeItem('contador');
        }

        console.log('hasta el dia siguiente', d);

      }
    }
  }

  reloj(){

    let mostrar_hora = () => {

      let mins8 = moment(moment().format('YYYY-MM-DD 20:00'));
      let now;

      let restante = mins8.diff(moment(),'seconds');

      if (restante < 0) {

        now = moment(moment(new Date()).add(1,'days').format('YYYY-MM-DD 20:00'));

      }else{

        now = moment(moment().format('YYYY-MM-DD 20:00'));

      }
      
      let seconds = now.diff(moment(),'seconds');

      this.hour = Math.floor(Math.abs(seconds) / 3600);

      this.hour = (this.hour < 10)? '0' + this.hour : this.hour;

      this.minute = Math.floor((Math.abs(seconds) / 60) % 60);

      this.minute = (this.minute < 10)? '0' + this.minute : this.minute;

      this.second = Math.abs(seconds) % 60;

      this.second = (this.second < 10)? '0' + this.second : this.second;

      this.tiempo = [this.hour, this.minute, this.second];

      this.service.reloj(this.tiempo);

      if (this.hour == 0 && this.minute == 0 && this.second == 0) {

        console.log('El sorteo ha finalizado');

        this.sorteo();
        let jugada = localStorage.getItem('combinacion');
        let ganador = JSON.parse(localStorage.getItem('ultimos'))[0];
        let puntos = 0;

        for (let i = 0; i <= ganador.length; ++i) {

          if (jugada[i] == ganador[i]) {
            puntos++;
          }

        }

        if (puntos > 0) {

          this.alerta('Hai raggiunto ' + puntos + ' punti!');

          const json = {

            "correo": localStorage.getItem('correo'),
            "usuario": localStorage.getItem('usuario'),
            "puntos": puntos.toString()

          };

          this.service.ganador(json).subscribe((data:any)=>{

          }, Error => {

            this.alerta(Error);

          });

        }

        /*localStorage.removeItem('numeros');
        localStorage.removeItem('fechas');
        localStorage.removeItem('dias');
        localStorage.removeItem('ultimos');
        localStorage.removeItem('contador');
        localStorage.removeItem('infrecuentes');
        localStorage.removeItem('infrecuencia');
        localStorage.removeItem('frecuentes');
        localStorage.removeItem('frecuencia');
        localStorage.removeItem('combinacion');
        localStorage.removeItem('ganadores');*/

        for (let i = 1; i < 6; i++) {
          localStorage.removeItem('e200' + i);
        }

        localStorage.removeItem('e200f');
        localStorage.removeItem('e200n');

        this.reloj();
        this.scrapping3();
        this.scrapping();

      }

  }

    let intervalo = setInterval(mostrar_hora, 1000);

  }

  sorteo(){

    this.numeros.numero = localStorage.getItem('combinacion');
    this.numeros.correo = localStorage.getItem('correo');

    const jsono = {
      nombre: this.numeros.numero,
      correo: this.numeros.correo,
    }

    this.service.number(this.numeros).subscribe((data:any) => { }, Error => {

          this.error(Error);

      });

  }

  scrapping3(){

    this.service.tabla3().subscribe((data: any) => {

        
        for (let i = 1; i <= 7; i++) {

          localStorage.setItem('e200' + i, data[i]);
          
        }
        
        let json = [];

        for (let i = 0; i < data.length - 1; i++) {

          json[i] = JSON.parse(data[i]);

        }
  
        let ganadores = [];
        let fechas = [];
        let numeros = [];
        let arrayn = [];
        let frecuentes = [];
        let frecuencia = [];
        let infrecuentes = [];
        let infrecuencia = [];
        let ganador;

        //console.log(data[8]);

        if (JSON.parse(data[8]).dettaglioConcorso.combinazioneVincente.estratti) {
          ganador = JSON.parse(data[8]).dettaglioConcorso.combinazioneVincente; 
        }

        for (let x = 0; x < json.length; x++) {

          if (json[x].concorsi) {

            for (let i = 0; i < json[x].concorsi.length; i++) {

              if (json[x].concorsi[i].combinazioneVincente) {

                let obj = json[x].concorsi[i].combinazioneVincente["estratti"];
                numeros.push(obj); 

              } 

            }

          }

        }

        for (let x = 0; x < json.length; x++) {

          if (json[x].concorsi) {

            for (let i = 0; i < json[x].concorsi.length; i++) {

              if (json[x].concorsi[i].combinazioneVincente) {

                let dato2 = json[x]["concorsi"][i].concorso["anno"];
                let fechasc = moment().subtract(i, 'd').format('MM');
                let fechasc2 = moment().subtract(i, 'd').format('DD');
                let obj = dato2 + fechasc + fechasc2;
                fechas.push(obj); 

              }

            }

          }

        }

        for (let i = 0; i < 4; i++) {

          if (JSON.parse(data[8]).dettaglioConcorso.dettaglioVincite.vincite[i]) {

            ganadores.push(JSON.parse(data[8]).dettaglioConcorso.dettaglioVincite.vincite[i]);

          }
    
        }

        /*for (let i = 0; i < 10; i++) {

          let obj = json2["frequenti"][i]["numero"];

          frecuentes.push(obj);

        }

        for (let i = 0; i < 10; i++) {

          let obj2 = json2["frequenti"][i]["frequenza"];

          frecuencia.push(obj2);

        }

        for (let i = 0; i < 10; i++) {

          let obj = json3["ritardatari"][i]["numero"];

          infrecuentes.push(obj);

        }

        for (let i = 0; i < 10; i++) {

          let obj2 = json3["ritardatari"][i]["ritardo"];

          infrecuencia.push(obj2);

        }*/

        localStorage.setItem('ganador', JSON.stringify(ganador));
        localStorage.setItem('ganadores', JSON.stringify(ganadores));
        localStorage.setItem('e200f', JSON.stringify(fechas));
        localStorage.setItem('e200n', JSON.stringify(numeros));
        /*localStorage.setItem('frecuentes', JSON.stringify(frecuentes));
        localStorage.setItem('frecuencia', JSON.stringify(frecuencia));
        localStorage.setItem('infrecuentes', JSON.stringify(infrecuentes));
        localStorage.setItem('infrecuencia', JSON.stringify(infrecuencia));*/
        this.scrapping();

    });

  }

  scrapping(){
    let dias = [];
    let fechas = [];
    let numeros = [];
    let ultimos = [];
    let data = JSON.parse(localStorage.getItem('e200f'));
    let data2 = JSON.parse(localStorage.getItem('e200n'));
    let meses = ["GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO", "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE"];
    let days = ["DOMENICA", "SABATO", "VENERDÌ", "GIOVEDÌ", "MERCOLEDÌ", "MARTEDÌ", "LUNEDÌ"];
    let json = [];

    for (let i = 0; i < 7; i++) {

      dias.push(data[i]);
      numeros.push(data2[i]);

    }


    localStorage.setItem('dias', JSON.stringify(dias));
    localStorage.setItem('numeros', JSON.stringify(numeros));

    for (let i = 0; i < dias.length; i++) {

      let mes =  moment().subtract(i, 'd').format('M');
      fechas[i] = moment().subtract(i, 'd').format('DD') + ' ' + meses[parseInt(mes) - 1] + ' ' + moment().subtract(i, 'd').format('Y');
      fechas[i] = fechas[i].replace(data, meses[i]);
      

    }

    localStorage.setItem('fechas', JSON.stringify(fechas));

  }

}
