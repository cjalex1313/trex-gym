import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'

import App from './App.vue'
import router from './router'
import './styles/main.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
	theme: {
		preset: Aura,
	},
	locale: {
		startsWith: 'Începe cu',
		contains: 'Conține',
		notContains: 'Nu conține',
		endsWith: 'Se termină cu',
		equals: 'Egal',
		notEquals: 'Diferit',
		noFilter: 'Fără filtru',
		lt: 'Mai mic decât',
		lte: 'Mai mic sau egal',
		gt: 'Mai mare decât',
		gte: 'Mai mare sau egal',
		dateIs: 'Data este',
		dateIsNot: 'Data nu este',
		dateBefore: 'Data este înainte de',
		dateAfter: 'Data este după',
		clear: 'Șterge',
		apply: 'Aplică',
		matchAll: 'Potrivire toate',
		matchAny: 'Potrivire oricare',
		addRule: 'Adaugă regulă',
		removeRule: 'Șterge regulă',
		accept: 'Da',
		reject: 'Nu',
		choose: 'Alege',
		upload: 'Încarcă',
		cancel: 'Anulează',
		dayNames: ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
		dayNamesShort: ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'],
		dayNamesMin: ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'],
		monthNames: [
			'Ianuarie',
			'Februarie',
			'Martie',
			'Aprilie',
			'Mai',
			'Iunie',
			'Iulie',
			'August',
			'Septembrie',
			'Octombrie',
			'Noiembrie',
			'Decembrie',
		],
		monthNamesShort: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'],
		today: 'Astăzi',
		weekHeader: 'Săpt.',
		firstDayOfWeek: 1,
		dateFormat: 'dd.mm.yy',
		weak: 'Slab',
		medium: 'Mediu',
		strong: 'Puternic',
		passwordPrompt: 'Introduceți parola',
		emptyFilterMessage: 'Nu s-au găsit rezultate',
		emptyMessage: 'Nu există opțiuni disponibile',
	},
})
app.use(ToastService)
app.use(router)

app.mount('#app')
