<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { Ref } from 'vue';
import countries from '../assets/countries.json';

const API_MAIN = '/blot';
const ENDPOINT = `${API_MAIN}/fr/paris-2024/medailles`;

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
  const resultValue = parse(json);
  result.value = resultValue;
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
  <div v-if="result !== null && result !== undefined">
     <table>
      <tr v-for="(countryResult, index) of result.results" class="country-line">
          <td>{{ index + 1 }}</td>
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
