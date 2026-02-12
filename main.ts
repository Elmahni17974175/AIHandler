/**
 * MSM AI Handler — Extension MakeCode
 * DaDa:bit + WonderCam (via dadabit)  
 *
 * IMPORTANT :
 * - Pas de basic.forever() ici (l’élève écrit la boucle dans son programme)
 */

//% color=#00BCD4 icon="\uf1b9" block="MSM AI Handler"
//% groups='["Init","Réglages","Capteurs ligne","Mouvements","Suivi de ligne","Vision (couleur)","Bras & Pince","Mission"]'
namespace msmAIHandler {
    // =========================================================
    // ÉTAT INTERNE
    // =========================================================
    let capteur1 = false
    let capteur2 = false
    let capteur3 = false
    let capteur4 = false

    // vitesses
    let vitesseToutDroit = 55
    let vitesseCorrection = 44
    let petiteVitesse = 33

    // vision
    let ID_CUBE = 1
    let X_MIN = 80
    let X_MAX = 240
    let Y_APPROCHE = 237
    let SEUIL_VALIDATION = 8

    // bras/pince
    let BRAS_HAUT = -60
    let BRAS_BAS = -5
    let PINCE_OUVERTE = 15
    let PINCE_FERMEE = -25
    let TEMPS_MOUVEMENT = 500
    let TEMPS_ATTENTE = 800

    // mission
    // 0 = recherche/ramassage, 1 = transport (porte un cube)
    let modeMission = 0
    let compteurValidation = 0

    // =========================================================
    // INIT
    // =========================================================

    //% block="initialiser le robot"
    //% group="Init"
    export function initialiserRobot(): void {
        dadabit.dadabit_init()
        wondercam.wondercam_init(wondercam.DEV_ADDR.x32)
        wondercam.ChangeFunc(wondercam.Functions.ColorDetect)
        brasAuRepos()
        basic.pause(500)
    }

    // =========================================================
    // RÉGLAGES
    // =========================================================

    //% block="régler vitesses | tout droit %vTD | correction %vC | petite %vP"
    //% group="Réglages"
    export function reglerVitesses(vTD: number, vC: number, vP: number): void {
        vitesseToutDroit = vTD
        vitesseCorrection = vC
        petiteVitesse = vP
    }

    //% block="régler vision | couleur ID %id | X min %xmin | X max %xmax | Y approche %y | validations %seuil"
    //% group="Réglages"
    export function reglerVision(id: number, xmin: number, xmax: number, y: number, seuil: number): void {
        ID_CUBE = id
        X_MIN = xmin
        X_MAX = xmax
        Y_APPROCHE = y
        SEUIL_VALIDATION = seuil
        compteurValidation = 0
    }

    //% block="régler bras/pince | bras haut %bh | bras bas %bb | pince ouverte %po | pince fermée %pf"
    //% group="Réglages"
    export function reglerBrasPince(bh: number, bb: number, po: number, pf: number): void {
        BRAS_HAUT = bh
        BRAS_BAS = bb
        PINCE_OUVERTE = po
        PINCE_FERMEE = pf
    }

    //% block="régler temps | mouvement (ms) %tm | attente (ms) %ta"
    //% group="Réglages"
    export function reglerTemps(tm: number, ta: number): void {
        TEMPS_MOUVEMENT = tm
        TEMPS_ATTENTE = ta
    }

    //% block="réinitialiser la mission (ne porte rien)"
    //% group="Réglages"
    export function resetMission(): void {
        modeMission = 0
        compteurValidation = 0
    }

    // =========================================================
    // GETTERS (pour reproduire la boucle des élèves)
    // =========================================================

    //% block="ID du cube"
    //% group="Réglages"
    export function ID_CUBE_get(): number {
        return ID_CUBE
    }

    //% block="Y d'approche"
    //% group="Réglages"
    export function Y_APPROCHE_get(): number {
        return Y_APPROCHE
    }

    //% block="seuil de validation"
    //% group="Réglages"
    export function SEUIL_VALIDATION_get(): number {
        return SEUIL_VALIDATION
    }

    // =========================================================
    // CAPTEURS LIGNE
    // =========================================================

    //% block="mettre à jour les capteurs de ligne"
    //% group="Capteurs ligne"
    export function mettreAJourCapteursLigne(): void {
        capteur1 = dadabit.line_followers(dadabit.LineFollowerSensors.S1, dadabit.LineColor.Black)
        capteur2 = dadabit.line_followers(dadabit.LineFollowerSensors.S2, dadabit.LineColor.Black)
        capteur3 = dadabit.line_followers(dadabit.LineFollowerSensors.S3, dadabit.LineColor.Black)
        capteur4 = dadabit.line_followers(dadabit.LineFollowerSensors.S4, dadabit.LineColor.Black)
    }

    //% block="arrivée détectée ? (S1 S2 S3 S4 sur noir)"
    //% group="Capteurs ligne"
    export function arriveeDetectee(): boolean {
        return capteur1 && capteur2 && capteur3 && capteur4
    }

    // =========================================================
    // MOUVEMENTS
    // =========================================================

    //% block="avancer à vitesse %v"
    //% group="Mouvements"
    export function avancer(v: number): void {
        dadabit.setLego360Servo(1, dadabit.Oriention.Counterclockwise, v)
        dadabit.setLego360Servo(2, dadabit.Oriention.Clockwise, v)
        dadabit.setLego360Servo(3, dadabit.Oriention.Counterclockwise, v)
        dadabit.setLego360Servo(4, dadabit.Oriention.Clockwise, v)
    }

    //% block="reculer à vitesse %v"
    //% group="Mouvements"
    export function reculer(v: number): void {
        dadabit.setLego360Servo(1, dadabit.Oriention.Clockwise, v)
        dadabit.setLego360Servo(2, dadabit.Oriention.Counterclockwise, v)
        dadabit.setLego360Servo(3, dadabit.Oriention.Clockwise, v)
        dadabit.setLego360Servo(4, dadabit.Oriention.Counterclockwise, v)
    }

    //% block="arrêter le robot"
    //% group="Mouvements"
    export function arreterRobot(): void {
        dadabit.setLego360Servo(1, dadabit.Oriention.Clockwise, 0)
        dadabit.setLego360Servo(2, dadabit.Oriention.Clockwise, 0)
        dadabit.setLego360Servo(3, dadabit.Oriention.Clockwise, 0)
        dadabit.setLego360Servo(4, dadabit.Oriention.Clockwise, 0)
    }

    //% block="corriger à gauche (vitesse %v)"
    //% group="Mouvements"
    export function corrigerAGauche(v: number): void {
        dadabit.setLego360Servo(1, dadabit.Oriention.Clockwise, v)
        dadabit.setLego360Servo(2, dadabit.Oriention.Clockwise, v)
        dadabit.setLego360Servo(3, dadabit.Oriention.Clockwise, v)
        dadabit.setLego360Servo(4, dadabit.Oriention.Clockwise, v)
    }

    //% block="corriger à droite (vitesse %v)"
    //% group="Mouvements"
    export function corrigerADroite(v: number): void {
        dadabit.setLego360Servo(1, dadabit.Oriention.Counterclockwise, v)
        dadabit.setLego360Servo(2, dadabit.Oriention.Counterclockwise, v)
        dadabit.setLego360Servo(3, dadabit.Oriention.Counterclockwise, v)
        dadabit.setLego360Servo(4, dadabit.Oriention.Counterclockwise, v)
    }

    // =========================================================
    // SUIVI DE LIGNE
    // =========================================================

    //% block="suivre la ligne"
    //% group="Suivi de ligne"
    export function suiviDeLigne(): void {
        if (capteur2 && capteur3) {
            avancer(vitesseToutDroit)
        } else if (capteur1 && capteur2 && (!capteur3 && !capteur4)) {
            corrigerAGauche(vitesseCorrection)
        } else if (capteur3 && capteur4 && (!capteur1 && !capteur2)) {
            corrigerADroite(vitesseCorrection)
        } else if (capteur2 && !capteur1 && (!capteur3 && !capteur4)) {
            // petite correction gauche
            dadabit.setLego360Servo(1, dadabit.Oriention.Counterclockwise, vitesseCorrection)
            dadabit.setLego360Servo(2, dadabit.Oriention.Clockwise, petiteVitesse)
            dadabit.setLego360Servo(3, dadabit.Oriention.Counterclockwise, vitesseCorrection)
            dadabit.setLego360Servo(4, dadabit.Oriention.Clockwise, petiteVitesse)
        } else if (capteur3 && !capteur1 && (!capteur2 && !capteur4)) {
            // petite correction droite
            dadabit.setLego360Servo(1, dadabit.Oriention.Counterclockwise, petiteVitesse)
            dadabit.setLego360Servo(2, dadabit.Oriention.Clockwise, vitesseCorrection)
            dadabit.setLego360Servo(3, dadabit.Oriention.Counterclockwise, petiteVitesse)
            dadabit.setLego360Servo(4, dadabit.Oriention.Clockwise, vitesseCorrection)
        } else if (capteur1 && !capteur2 && (!capteur3 && !capteur4)) {
            corrigerAGauche(vitesseToutDroit)
        } else if (capteur4 && !capteur1 && (!capteur2 && !capteur3)) {
            corrigerADroite(vitesseToutDroit)
        }
    }

    // =========================================================
    // VISION (couleur)
    // =========================================================

    //% block="mettre à jour la caméra"
    //% group="Vision (couleur)"
    export function mettreAJourCamera(): void {
        wondercam.UpdateResult()
    }

    //% block="couleur ID %id détectée ?"
    //% group="Vision (couleur)"
    export function cubeDetecte(id: number): boolean {
        return wondercam.isDetectedColorId(id)
    }

    //% block="position Y de la couleur ID %id"
    //% group="Vision (couleur)"
    export function yCube(id: number): number {
        return wondercam.XOfColorId(wondercam.Options.Pos_Y, id)
    }

    //% block="détection stable | couleur ID %id | seuil %seuil"
    //% group="Vision (couleur)"
    export function detectionStableCouleur(id: number, seuil: number): boolean {
        const detecte = wondercam.isDetectedColorId(id)
        const x = wondercam.XOfColorId(wondercam.Options.Pos_X, id)

        if (detecte && x >= X_MIN && x <= X_MAX) {
            compteurValidation += 1
            if (compteurValidation > seuil) {
                compteurValidation = 0
                return true
            }
        } else {
            compteurValidation = 0
        }
        return false
    }

    //% block="cube détecté de façon stable ? (réglages)"
    //% group="Vision (couleur)"
    export function cubeDetecteStable(): boolean {
        return detectionStableCouleur(ID_CUBE, SEUIL_VALIDATION)
    }

    //% block="approcher le cube (jusqu'à Y d'approche)"
    //% group="Vision (couleur)"
    export function approcherCube(): void {
        while (wondercam.XOfColorId(wondercam.Options.Pos_Y, ID_CUBE) < Y_APPROCHE
            && wondercam.isDetectedColorId(ID_CUBE)) {
            mettreAJourCamera()
            mettreAJourCapteursLigne()
            suiviDeLigne()
        }
    }

    // =========================================================
    // BRAS & PINCE
    // =========================================================

    //% block="bras en haut"
    //% group="Bras & Pince"
    export function brasEnHaut(): void {
        dadabit.setLego270Servo(5, BRAS_HAUT, TEMPS_MOUVEMENT)
    }

    //% block="bras en bas"
    //% group="Bras & Pince"
    export function brasEnBas(): void {
        dadabit.setLego270Servo(5, BRAS_BAS, TEMPS_MOUVEMENT)
    }

    //% block="ouvrir la pince"
    //% group="Bras & Pince"
    export function ouvrirPince(): void {
        dadabit.setLego270Servo(6, PINCE_OUVERTE, TEMPS_MOUVEMENT)
    }

    //% block="fermer la pince"
    //% group="Bras & Pince"
    export function fermerPince(): void {
        dadabit.setLego270Servo(6, PINCE_FERMEE, TEMPS_MOUVEMENT)
    }

    //% block="bras au repos (bras haut + pince ouverte)"
    //% group="Bras & Pince"
    export function brasAuRepos(): void {
        brasEnHaut()
        basic.pause(300)
        ouvrirPince()
        basic.pause(300)
    }

    //% block="attraper le cube"
    //% group="Bras & Pince"
    export function attraperCube(): void {
        arreterRobot()
        basic.pause(500)
        brasEnBas()
        basic.pause(TEMPS_ATTENTE)
        fermerPince()
        basic.pause(TEMPS_ATTENTE)
        brasEnHaut()
        basic.pause(TEMPS_ATTENTE)
        modeMission = 1
    }

    //% block="déposer le cube"
    //% group="Bras & Pince"
    export function deposerCube(): void {
        brasEnBas()
        basic.pause(TEMPS_ATTENTE)
        ouvrirPince()
        basic.pause(TEMPS_ATTENTE)
        brasEnHaut()
        basic.pause(TEMPS_ATTENTE)
        modeMission = 0
    }

    // =========================================================
    // MISSION
    // =========================================================

    //% block="ne porte pas de cube ?"
    //% group="Mission"
    export function nePortePasCube(): boolean {
        return modeMission == 0
    }

 

    //% block="bip (signal sonore)"
    //% group="Mission"
    export function jouerBip(): void {
        music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
    }

    //% block="gérer la destination (stop, déposer si besoin, demi-tour)"
    //% group="Mission"
    export function destination(): void {
        arreterRobot()
        basic.pause(500)

        if (modeMission == 1) {
            deposerCube()
        }

        mettreAJourCapteursLigne()

        // impulsion demi-tour
        dadabit.setLego360Servo(1, dadabit.Oriention.Clockwise, vitesseCorrection)
        dadabit.setLego360Servo(2, dadabit.Oriention.Counterclockwise, vitesseCorrection)
        dadabit.setLego360Servo(3, dadabit.Oriention.Clockwise, vitesseCorrection)
        dadabit.setLego360Servo(4, dadabit.Oriention.Counterclockwise, vitesseCorrection)
        basic.pause(500)

        // tourner jusqu’à retrouver la bonne condition de reprise
        while (capteur1 || capteur2 || !(capteur3 && capteur4)) {
            corrigerADroite(vitesseCorrection)
            mettreAJourCapteursLigne()
        }
    }

    //% block="cycle mission (1 étape)"
    //% group="Mission"
    export function cycleMission(): void {
        mettreAJourCamera()
        mettreAJourCapteursLigne()

        if (modeMission == 0 && cubeDetecteStable()) {
            jouerBip()
            approcherCube()
            attraperCube()
        }

        if (arriveeDetectee()) {
            destination()
        } else {
            suiviDeLigne()
        }
    }
}
