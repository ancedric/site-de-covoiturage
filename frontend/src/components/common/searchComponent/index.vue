<template>
    <div class="container">
        <form @submit.prevent="handleSearch">
            <div class="form">
                <div class="form-input">
                    <label for="depart">Départ</label>
                    <input type="text" name="depart" class="input" v-model="depart">
                </div>
                <div class="form-input">
                    <label for="destination">Destination</label>
                    <input type="text" name="destination" class="input" v-model="destination">
                </div>
                <div class="form-input">
                    <label for="date">Date de départ</label>
                    <input type="text" name="date" class="input" v-model="dateDepart">
                </div>
            </div>
            <div class="submission">
                <input type="submit" class="submit-btn" value="Rechercher un trajet">
            </div>
        </form>
        
    </div>
</template>

<script setup>
</script>

<style scoped>
    .container{
        width: 80%;
        background-color: #eee;
        color: #000;
        border-radius: 15px;
        height: 130px;
        box-shadow: 0 0 50px rgba(0,0,0,0.3);

        form{
            display: flex;
            flex-direction:column;
            justify-content: center;
            align-items: center;
            gap: 20px;
            width: 100%;
            .form{
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 60px;
                width: 100%;

                .form-input{
                    display: flex;
                    flex-direction:column;
                    justify-content: center;
                    align-items: center;
                    width: 100%;

                    label{
                        text-align: left;
                    }
                    .input{
                        width: 70%;
                        height: 30px;
                        background-color: transparent;
                        border: 1px solid #487BFB;
                        border-radius: 12px;
                        padding-left: 20px;
                    }
                }
            }
            .submission{
                width: 100%;

                input{
                    width: 80%;
                    height: 40px;
                    background-color: #487BFB;;
                    color: #eee;
                    border-radius: 12px;
                    cursor: pointer;
                }
            }
        }
    }
</style>