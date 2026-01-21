<template>
  <div class="rating-container">
    <h2>Évaluer le conducteur</h2>
    <p class="current-rating-info">Note actuelle : {{ rating.toFixed(1) }} / 5 ({{ numberOfRatings }} évaluations)</p>
    
    <div 
      class="star-container"
      @mouseleave="hoveredRating = 0"
    >
      <!-- Boucle pour afficher 5 étoiles -->
      <img
        v-for="star in 5"
        :key="star"
        :src="star <= (hoveredRating || selectedRating) ? filledStar : emptyStar"
        alt="Étoile d'évaluation"
        class="star-icon"
        @mouseover="hoveredRating = star"
        @click="selectRating(star)"
      />
    </div>

    <!-- Afficher la note sélectionnée -->
    <div v-if="selectedRating > 0" class="selected-rating-display">
      <p>Votre note : {{ selectedRating }} / 5</p>
    </div>

    <!-- Champ pour le commentaire -->
    <div class="comment-section">
      <label for="comment" class="comment-label">Votre commentaire (facultatif) :</label>
      <textarea
        id="comment"
        v-model="comment"
        rows="4"
        placeholder="Laissez un commentaire sur votre expérience..."
        class="comment-textarea"
      ></textarea>
    </div>

    <button
      @click="submitRating"
      :disabled="selectedRating === 0"
      class="submit-button"
    >
      Soumettre mon avis
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { defineProps, defineEmits } from 'vue';
import filledStar from '../../../assets/icons/filled_star.png'
import emptyStar from '../../../assets/icons/empty_star.png'

// Définition des props : la note actuelle et le nombre d'évaluations
const props = defineProps({
  rating: {
    type: Number,
    required: true,
    default: 0
  },
  numberOfRatings: {
    type: Number,
    required: true,
    default: 0
  }
});

// Définition des événements émis par le composant
const emit = defineEmits(['submit-rating']);

// États internes du composant
const selectedRating = ref(0); // Note sélectionnée par l'utilisateur
const hoveredRating = ref(0); // Note survolée par la souris
const comment = ref(''); // Commentaire laissé par l'utilisateur

// Gère la sélection d'une note
const selectRating = (starIndex) => {
  selectedRating.value = starIndex;
};

// Gère la soumission de la note
const submitRating = () => {
  if (selectedRating.value > 0) {
    // Émet un événement avec la note et le commentaire
    const reviewData = {
      note: selectedRating.value,
      commentaire: comment.value
    };
    emit('submit-rating', reviewData);
    
    // Après la soumission, vous pourriez vouloir réinitialiser la sélection et le commentaire
    selectedRating.value = 0;
    comment.value = '';
  }
};
</script>
<style scoped>
.rating-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

h2 {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.current-rating-info {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.star-container {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.star-icon {
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
  cursor: pointer;
  transition-property: all;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.star-icon:hover {
  transform: scale(1.1);
}

.selected-rating-display {
  margin-top: 1rem;
}

.selected-rating-display p {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 500;
  color: #2563eb;
}
.comment-section {
  width: 100%;
  margin-bottom: 20px;
}

.comment-label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #34495e;
}

.comment-textarea {
  width: 100%;
  border: 1px solid #bdc3c7;
  border-radius: 8px;
  padding: 10px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.comment-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.submit-button {
  margin-top: 1.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #2563eb;
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition-property: all;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.submit-button:hover {
  background-color: #1d4ed8;
}

.submit-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>