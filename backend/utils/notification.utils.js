const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurer le transporteur d'e-mails
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Fonction pour envoyer un e-mail de base
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Covoiturage App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail envoyé : %s', info.messageId);
        console.log('URL de prévisualisation : %s', nodemailer.getTestMessageUrl(info)); 
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
        return false;
    }
};

// Fonction spécifique pour une nouvelle réservation
const sendNewReservationNotification = async (passengerEmail, passengerName, tripDetails, reservationDetails) => {
    const subject = 'Votre réservation de covoiturage est confirmée !';
    const htmlContent = `
        <p>Bonjour ${passengerName},</p>
        <p>Votre réservation pour le trajet suivant a été enregistrée avec succès :</p>
        <ul>
            <li><strong>Départ :</strong> ${tripDetails.lieu_depart_details ? tripDetails.lieu_depart_details.nom_lieu : 'N/A'}</li>
            <li><strong>Arrivée :</strong> ${tripDetails.lieu_arrivee_details ? tripDetails.lieu_arrivee_details.nom_lieu : 'N/A'}</li>
            <li><strong>Date :</strong> ${new Date(tripDetails.date_depart).toLocaleDateString()}</li>
            <li><strong>Heure :</strong> ${tripDetails.heure_depart}</li>
            <li><strong>Places réservées :</strong> ${reservationDetails.nb_places_reservees}</li>
            <li><strong>Prix total :</strong> ${reservationDetails.nb_places_reservees * tripDetails.prix_par_place} XAF</li>
        </ul>
        <p>N'hésitez pas à contacter le conducteur si vous avez des questions.</p>
        <p>Merci d'utiliser notre service de covoiturage !</p>
    `;
    return sendEmail(passengerEmail, subject, htmlContent);
};

// Fonction pour notifier le conducteur d'une nouvelle réservation
const sendDriverNewReservationNotification = async (driverEmail, driverName, passengerName, tripDetails, reservationDetails) => {
    const subject = 'Nouvelle réservation pour votre trajet !';
    const htmlContent = `
        <p>Bonjour ${driverName},</p>
        <p>Une nouvelle réservation a été effectuée pour votre trajet de ${tripDetails.lieu_depart_details ? tripDetails.lieu_depart_details.nom_lieu : 'N/A'} à ${tripDetails.lieu_arrivee_details ? tripDetails.lieu_arrivee_details.nom_lieu : 'N/A'} le ${new Date(tripDetails.date_depart).toLocaleDateString()} à ${tripDetails.heure_depart}.</p>
        <ul>
            <li><strong>Passager :</strong> ${passengerName}</li>
            <li><strong>Places réservées :</strong> ${reservationDetails.nb_places_reservees}</li>
            <li><strong>Statut de la réservation :</strong> ${reservationDetails.statut}</li>
        </ul>
        <p>Veuillez consulter votre tableau de bord pour plus de détails.</p>
    `;
    return sendEmail(driverEmail, subject, htmlContent);
};

// Fonction pour notifier l'annulation d'une réservation (par passager ou conducteur)
const sendReservationCancellationNotification = async (recipientEmail, recipientName, reason, tripDetails, reservationDetails) => {
    const subject = 'Annulation de votre réservation de covoiturage';
    const htmlContent = `
        <p>Bonjour ${recipientName},</p>
        <p>Votre réservation pour le trajet suivant a été annulée :</p>
        <ul>
            <li><strong>Départ :</strong> ${tripDetails.lieu_depart_details ? tripDetails.lieu_depart_details.nom_lieu : 'N/A'}</li>
            <li><strong>Arrivée :</strong> ${tripDetails.lieu_arrivee_details ? tripDetails.lieu_arrivee_details.nom_lieu : 'N/A'}</li>
            <li><strong>Date :</strong> ${new Date(tripDetails.date_depart).toLocaleDateString()}</li>
            <li><strong>Heure :</strong> ${tripDetails.heure_depart}</li>
            <li><strong>Places initialement réservées :</strong> ${reservationDetails.nb_places_reservees}</li>
        </ul>
        <p>Raison : ${reason}</p>
        <p>Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter.</p>
    `;
    return sendEmail(recipientEmail, subject, htmlContent);
};

module.exports = {
    sendEmail,
    sendNewReservationNotification,
    sendDriverNewReservationNotification,
    sendReservationCancellationNotification,
    // Ajoutez d'autres fonctions de notification au besoin (ex: trajet annulé, changement de statut, etc.)
};