<template>
  <div class="rating-ctn">
    <div class="star-ctn">
        <img 
            v-for="star in 5"
            :key="star"
            :src="star <= rating ? filledStar : emptyStar"
            alt="Étoile d'évaluation"
        />
    </div>
  </div>
</template>

<script setup>
  import filledStar from '../../../assets/icons/filled_star.png' 
  import emptyStar from '../../../assets/icons/empty_star.png'
const props = defineProps({
  rating: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 5
  }
});
</script>
<style scoped>
.rating-ctn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 150px;
  height: 30px;

  .star-ctn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;

    img{
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}
</style>