<script setup lang="ts">
import { ref, watchEffect, watch } from 'vue';
import type { Ref } from 'vue';
import { format} from 'date-fns';
import countries from '../assets/countries.json';

const API_MAIN = '/blot';
const ENDPOINT = `${API_MAIN}/en/paris-2024/medals`;

const API_MAIN_2 = '/api';
const ENDPOINT_2 = `${API_MAIN_2}/medals`;

type Medals = {
  bronze: number;
  silver: number;
  gold: number;
};
type Upgraded = {
  lastUpdated?: Date;
  lastUpdatedFormatted?: string;
  results: {
    country: {
      code: string;
      name: string;
      flagUrl: string;
    };
    medals: Medals;
    rank: {
      official: number;
      true: number;
    };
    count: number;
    score: number;
  }[];
};

type Response1 = {
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
    };
  };
};

type Response2 = {
  last_updated: string;
  length: number;
  results: {
    country: {
      code: string;
      iso_alpha_2: string;
      name: string;
    };
    medals: Medals;
    rank: number;
  }[];
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

function sortAndSetRank(result: Upgraded): Upgraded {
  let prevScore = 0;
  let prevTrueRank = 1;

  result.results = result.results
    .sort((a, b) => b.score - a.score)
    .map((res) => {
      let trueRank = prevTrueRank;
      if (prevScore && prevScore > res.score) {
        trueRank = prevTrueRank + 1;
      }

      res.rank.true = trueRank;

      prevScore = res.score;
      prevTrueRank = res.rank.true;

      return res;
    });

    return result;
}

function parse(response: Response1): Upgraded {
  const lastUpdated = new Date();
  const results =
    response.props.pageProps.initialMedals.medalStandings.medalsTable
      .map(({ organisation, description, medalsNumber, rank }) => {
        const medals = medalsNumber.find(
          ({ type }) => type === 'Total'
        ) as Medals;
        const country = countriesMap.get(organisation);
        const score =
          medals.gold * MEDALS_VALUE.gold +
          medals.silver * MEDALS_VALUE.silver +
          medals.bronze * MEDALS_VALUE.bronze;

        return {
          country: {
            name: description,
            code: organisation,
            flagUrl: `https://cdn.jsdelivr.net/npm/flag-icons@6.3.0/flags/4x3/${country.alpha2}.svg`,
          },
          medals,
          count: medals.gold + medals.silver + medals.bronze,
          score,
          rank: {
            official: rank,
            true: 0,
          },
        };
      });

  return sortAndSetRank({
    lastUpdated,
    lastUpdatedFormatted: format(lastUpdated, 'yyyy-MM-dd, HH:mm'),
    results,
  });
}

function parse2(response: Response2): Upgraded {
  const lastUpdated = new Date(response.last_updated);
  const lastUpdatedFormatted = format(lastUpdated, 'yyyy-MM-dd, HH:mm');
  const results = response.results
    .map(({ country, medals, rank }) => {
      const score =
        medals.gold * MEDALS_VALUE.gold +
        medals.silver * MEDALS_VALUE.silver +
        medals.bronze * MEDALS_VALUE.bronze;

      return {
        country: {
          name: country.name,
          code: country.code,
          flagUrl: `https://cdn.jsdelivr.net/npm/flag-icons@6.3.0/flags/4x3/${country.iso_alpha_2.toLowerCase()}.svg`,
        },
        medals,
        count: medals.gold + medals.silver + medals.bronze,
        score,
        rank: {
          official: rank,
          true: 0,
        },
      };
    })
    .sort((a, b) => b.score - a.score);

  return sortAndSetRank({
    lastUpdated,
    lastUpdatedFormatted,
    results,
  })
}

watchEffect(async () => {
  let trueResultValue: Upgraded;
  try {
    const parser = new DOMParser();
    const response = await (
      await fetch(ENDPOINT, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    ).text();
    const html = parser.parseFromString(response, 'text/html');
    const jsonData = html.getElementById('__NEXT_DATA__') as HTMLScriptElement;
    const json: Response1 = JSON.parse(jsonData.innerText);
    trueResultValue = parse(json);
  } catch (e) {
    console.error('An error happened while fetching the data, switching to other endpoint', e)
    const response: Response2 = await (await fetch(ENDPOINT_2)).json();
    trueResultValue = parse2(response);
  }
  const officialResultValue: Upgraded = {
    lastUpdated: trueResultValue.lastUpdated,
    lastUpdatedFormatted: trueResultValue.lastUpdatedFormatted,
    results: [...trueResultValue.results].sort(
      (a, b) => a.rank.official - b.rank.official
    ),
  };
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
    <span class="switch-label" :class="{ active: !showOfficial }"
      >Points ranking</span
    >
    <label class="show-official-checkbox switch"
      ><input v-model="showOfficial" type="checkbox" /><span
        class="slider round"
      ></span
    ></label>
    <span class="switch-label" :class="{ active: showOfficial }"
      >Official ranking</span
    >
  </div>

  <div v-if="result !== null && result !== undefined">
    <p class="last-updated">Last updated at: {{ result.lastUpdatedFormatted }}</p>
    <table>
      <tr
        v-for="{ count, country, medals, rank, score } of result.results"
        class="country-line"
      >
        <td v-if="!showOfficial">{{ rank.true }}</td>
        <td v-else>{{ rank.official }}</td>
        <td>
          <div
            class="country-image"
            v-bind:style="{
              backgroundImage: 'url(' + country.flagUrl + ')',
            }"
          ></div>
        </td>
        <td class="country-name">{{ country.name }}</td>
        <td class="medals" :class="{ 'text-grey': !medals.gold }">
          <div><span>🥇</span> {{ medals.gold }}</div>
        </td>
        <td class="medals" :class="{ 'text-grey': !medals.silver }">
          <div><span>🥈</span> {{ medals.silver }}</div>
        </td>
        <td class="medals" :class="{ 'text-grey': !medals.bronze }">
          <div><span>🥉</span> {{ medals.bronze }}</div>
        </td>
        <td class="medals-count">{{ count }} medals</td>
        <td class="score">
          <div>
            <span class="big-number">{{ score }}</span> points
          </div>
        </td>
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
  -webkit-transition: 0.4s;
  transition: 0.4s;
  background-color: #2196f3;
}

.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
}

.switch-label.active {
  color: #2196f3;
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

.last-updated {
  font-size: small;
  color: grey;
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
