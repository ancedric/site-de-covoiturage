<template>
    <div class="comments-container">
        <h2>Avis et commentaires</h2>
        
        <!-- Message de chargement -->
        <div v-if="loading" class="loading-message">Chargement des commentaires...</div>

        <!-- Affichage des commentaires -->
        <div class="comments-list" v-else-if="comments.length > 0">
            <div
                v-for="comment in comments"
                :key="comment.id_avis"
                class="comment-card"
            >
                <div class="comment-header">
                    <p class="author-name">
                        Par : <strong>{{ comment.auteur_details.prenom }} {{ comment.auteur_details.nom }}</strong>
                    </p>
                    <p class="comment-date">
                        Le {{ formatDate(comment.date_avis) }}
                    </p>
                </div>
                <div class="comment-content">
                    <p>{{ comment.commentaire }}</p>
                </div>
            </div>
        </div>
        <div v-else class="no-comments-message">
            <p>Aucun commentaire n'a été laissé pour ce trajet...</p>
        </div>
    </div>
    </template>

<script setup>
    import { ref, onMounted, defineProps } from 'vue';

    const props = defineProps({
        tripId: {
            type: Number,
            required: true
        }
    });
    import apiClient from '../../../services/api'
    const comments = ref([]);
    const loading = ref(true);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    const fetchComments = async () => {
        loading.value = true;
        try {
            const response = await apiClient.get(`/for-trip/${props.tripId}`);
            // Filtrer pour ne garder que les avis qui ont un commentaire
            comments.value = response.data.filter(review => review.commentaire);
        } catch (error) {
            console.error('Erreur lors de la récupération des commentaires:', error);
        } finally {
            loading.value = false;
        }
    };

    onMounted(fetchComments);
    </script>

    <style scoped>
    .comments-container {
    padding: 2rem;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }

    h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    text-align: center;
    }

    .comments-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    }

    .comment-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    background-color: #f9f9f9;
    }

    .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #7f8c8d;
    }

    .author-name {
    font-weight: 500;
    }

    .comment-content p {
    font-size: 1rem;
    line-height: 1.5;
    color: #34495e;
    }

    .no-comments-message, .loading-message {
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
    margin: 2rem 0;
    }

    .submit-form-container {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e0e0e0;
    }

    h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 1rem;
    }

    .comment-textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #bdc3c7;
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    resize: vertical;
    min-height: 100px;
    transition: border-color 0.2s;
    }

    .comment-textarea:focus {
    outline: none;
    border-color: #3498db;
    }

    .submit-button {
    display: block;
    width: 100%;
    padding: 12px 25px;
    margin-top: 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 30px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    }

    .submit-button:disabled {
    background-color: #b4c9e2;
    cursor: not-allowed;
    }

    .submit-button:not(:disabled):hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    }
</style>