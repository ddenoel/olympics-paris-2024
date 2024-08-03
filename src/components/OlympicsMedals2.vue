<script setup lang="ts">
import { ref, watchEffect, watch } from 'vue';
import type { Ref } from 'vue';
import countries from '../assets/countries.json';

const API_MAIN = '/blot';
const ENDPOINT = `${API_MAIN}/en/paris-2024/medals`;

type Medals = {
  bronze: number;
  silver: number;
  gold: number;
};
type Upgraded = {
  results: {
    country: {
      code: string;
      name: string;
      flagUrl: string;
    };
    medals: Medals;
    rank: number;
    count: number;
    score: number;
  }[];
};

type Response = {
  props: {
    pageProps: {
      initialMedals: {
        medalStandings: {
          medalsTable: {
            rank: number;
            organisation: string;
            description: string;
            medalsNumber: (Medals & {
              type: 'Total' | 'Women' | 'Mixed' | 'Men';
            })[];
          }[];
        };
      };
    }
  };
};

const result: Ref<Upgraded | null> = ref(null);
const trueResult: Ref<Upgraded | null> = ref(null);
const officialResult: Ref<Upgraded | null> = ref(null);
const showOfficial = ref(false);

const MEDALS_VALUE = {
  gold: 5,
  silver: 3,
  bronze: 1,
} as const;

const medalsValue = ref(MEDALS_VALUE);

const countriesMap = new Map();
countries.countries.forEach((country) => {
  countriesMap.set(country.id, country);
});

function parse(response: Response): Upgraded {
  const results = response.props.pageProps.initialMedals.medalStandings.medalsTable
    .map(({ organisation, description, medalsNumber, rank }) => {
      const medals = medalsNumber.find(
        ({ type }) => type === 'Total'
      ) as Medals;
      const country = countriesMap.get(organisation);

      return {
        country: {
          name: description,
          code: organisation,
          flagUrl: `https://cdn.jsdelivr.net/npm/flag-icons@6.3.0/flags/4x3/${country.alpha2}.svg`
        },
        medals,
        count: medals.gold + medals.silver + medals.bronze,
        score:
          medals.gold * MEDALS_VALUE.gold +
          medals.silver * MEDALS_VALUE.silver +
          medals.bronze * MEDALS_VALUE.bronze,
        rank,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    results,
  };
}

watchEffect(async () => {
  const parser = new DOMParser();
  const response = await (
    await fetch(ENDPOINT, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  ).text();
  const html = parser.parseFromString(response, 'text/html');
  const jsonData = html.getElementById('__NEXT_DATA__') as HTMLScriptElement;
  const json: Response = JSON.parse(jsonData.innerText);
  const trueResultValue = parse(json);
  const officialResultValue: Upgraded = {results: [...trueResultValue.results].sort((a, b) => a.rank - b.rank)};
  trueResult.value = trueResultValue;
  result.value = trueResultValue;
  officialResult.value = officialResultValue;
});

watch(showOfficial, (newVal) => {
  if (newVal) {
    result.value = officialResult.value;
  } else {
    result.value = trueResult.value;
  }
});
</script>

<template>
  <h1>True Paris 2024 ranking</h1>
  <div class="medals-scores">
    <h3>Medals scores</h3>
    <p>
      🥇 <span class="big-number">{{ medalsValue.gold }}</span> points
    </p>
    <p>
      🥈 <span class="big-number">{{ medalsValue.silver }}</span> points
    </p>
    <p>
      🥉 <span class="big-number">{{ medalsValue.bronze }}</span> points
    </p>
  </div>
  <div class="show-official-container">
    <span class="switch-label" :class="{ 'active': !showOfficial }">True ranking</span>
    <label class="show-official-checkbox switch"><input v-model="showOfficial" type="checkbox" /><span class="slider round"></span></label>
    <span class="switch-label" :class="{ 'active': showOfficial }">Official ranking</span>
  </div>
  
  <div v-if="result !== null && result !== undefined">
     <table>
      <tr v-for="(countryResult, index) of result.results" class="country-line">
          <td v-if="!showOfficial">{{ index + 1 }}</td>
          <td v-else>{{ countryResult.rank }}</td>
          <td>
            
          <div class="country-image" v-bind:style="{ backgroundImage: 'url(' + countryResult.country.flagUrl + ')' }"></div>
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

.medals-scores h3,
.medals-scores p {
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
  min-height: 36px;
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

.show-official-container {
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 1rem;
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
}

.show-official-checkbox {
  cursor: pointer;
}

/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
  background-color: #2196F3;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

.switch-label.active {
  color: #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

@media (max-width: 768px) {
  .medals-scores {
    position: static;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
  .medals-scores h3,
  .medals-scores p {
    margin-bottom: 0;
  }

  .medals-count {
    display: none;
  }

  .medals > div,
  .score > div {
    display: flex;
    flex-direction: column;
  }
}
</style>
