<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { Ref } from 'vue'
import { formatDate } from 'date-fns';

/** API : https://github.com/kevle1/paris-2024-olympic-api */
const API_MAIN = '/api';
const ENDPOINT = `${API_MAIN}/medals`;

type Medals = {
  bronze: number;
  silver: number;
  gold: number;
};
type Result = {
  country: {
    code: string;
    iso_alpha_2: string;
    name: string;
  };
  medals: Medals;
  rank: number;
};
type Response = {
  last_updated: string;
  length: number;
  results: Result[];
};
type Upgraded = {
  lastUpdated: Date;
  lastUpdatedFormatted: string;
  results: (Result & { count: number; score: number })[];
};

const result: Ref<Upgraded | null> = ref(null);

const MEDALS_VALUE = {
  gold: 5,
  silver: 3,
  bronze: 1,
} as const;

const medalsValue = ref(MEDALS_VALUE);

function parse(response: Response): Upgraded {
  const { last_updated, results } = response;
  const upgradedResults = results.map(({ country, medals, rank }) => {
    return {
      country,
      medals,
      count: medals.gold + medals.silver + medals.bronze,
      score:
        medals.gold * MEDALS_VALUE.gold +
        medals.silver * MEDALS_VALUE.silver +
        medals.bronze * MEDALS_VALUE.bronze,
      rank,
    };
  }).sort((a, b) => b.score - a.score);

  return {
    lastUpdated: new Date(last_updated),
    lastUpdatedFormatted: formatDate(new Date(last_updated), 'yyyy-MM-dd, HH:mm'),
    results: upgradedResults,
  };


}

watchEffect(async () => {
  const response: Response = await ( await fetch(ENDPOINT)).json();
  result.value = parse(response);
  console.log(parse(response))
});
</script>

<template>
  <h1>True Paris 2024 ranking</h1>
  <div class="medals-scores">
    <h3>Medals scores</h3>
    <p>🥇 <span class="big-number">{{ medalsValue.gold }}</span> points</p>
    <p>🥈 <span class="big-number">{{ medalsValue.silver }}</span> points</p>
    <p>🥉 <span class="big-number">{{ medalsValue.bronze }}</span> points</p>
  </div>
  <div v-if="result !== null && result !== undefined">
     <p class="text-grey">Last updated: {{ result.lastUpdatedFormatted }}</p>
     <br/>
     <table>
      <tr v-for="(countryResult, index) of result.results" class="country-line">
          <td>{{ index + 1 }}</td>
          <td>
            <!--<img v-bind:src="'https://cdn.jsdelivr.net/npm/flag-icons@6.3.0/flags/4x3/'+countryResult.country.iso_alpha_2.toLowerCase()+'.svg'" width="20"/>-->
            <div class="country-image" v-bind:style="{ backgroundImage: 'url(' + 'https://cdn.jsdelivr.net/npm/flag-icons@6.3.0/flags/4x3/'+countryResult.country.iso_alpha_2.toLowerCase()+'.svg' + ')' }"></div>
          </td>
          <td class="country-name">{{  countryResult.country.name }}</td>
          <td class="medals" :class="{ 'text-grey': !countryResult.medals.gold }">  <div><span>🥇</span> {{  countryResult.medals.gold }}  </div></td>
          <td class="medals" :class="{ 'text-grey': !countryResult.medals.silver }"><div><span>🥈</span> {{  countryResult.medals.silver }}</div></td>
          <td class="medals" :class="{ 'text-grey': !countryResult.medals.bronze }"><div><span>🥉</span> {{  countryResult.medals.bronze }}</div></td>
          <td class="medals-count">{{  countryResult.count }} medals</td>
          <td class="score"><div><span class="big-number">{{  countryResult.score }}</span> points</div></td>
      </tr>
    </table>
  </div>

</template>

<style scoped>
.medals-scores {
  position: absolute;
  right: 1rem;
  top: 1rem;
  border-radius: 4px;
  border: 1px silver solid;
  padding: 1rem;
}

.medals-scores h3, .medals-scores p {
  margin-top: 0;
}

.big-number {
  font-size: 1.5rem;
  font-weight: bold;
}

table {
  width: 100%;
  border-collapse: collapse;
}

td {
  padding: 0.5rem;
}

.country-image {
  width: 20px;
  aspect-ratio: 4/3;
  background-size: cover;
  background-position: center;
  border-radius: 1px;
}

.country-name {
  text-align: left;
}

@media (max-width: 768px) {
  .medals-scores {
    position: static;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
  .medals-scores h3, .medals-scores p {
    margin-bottom: 0;
  }

  .medals-count {
    display: none;
  }

  .medals>div, .score>div {
    display: flex;
    flex-direction: column;
  }
}
</style>
