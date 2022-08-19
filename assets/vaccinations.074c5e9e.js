import{M as V,L as q,B,S,a as D,b as L,Q as A,c as v,d as T}from"./map-bar.3136b8cb.js";import{_ as j,m as M,r as m,o as l,c as _,a as e,w as o,Q as R,F as b,u as N,b as t,d as r,e as h,f as u,R as g,i as P,j as U,k as F,l as W,n as E,g as G,h as k,p as d,q as x,t as O,s as z}from"./index.2baa40a8.js";import{Q as f}from"./QSeparator.b99ed21e.js";import{Q as H,a as J}from"./QPageContainer.cfa964bf.js";import{I as p}from"./Intersection.43c3e1c6.js";const K={components:{MapChart:V,LineChart:q,BarChart:B,Selector:S,LineChartOverview:D,MapBarChart:L},data(){return{drawer:!0,selectorVisible:!1,charts:{map:{loading:!0},line:{loading:!0}},elements:[{icon:"bar_chart",content:"Rank, Bar Chart",id:0,active:!0,charts:[{name:"bar-chart",title:"Daily vaccinations Rank",color:"rgb(0, 3, 18)",category:"vac",col:6}]},{icon:"timeline",content:"TimeLine, Line Chart",id:1,active:!1,charts:[{name:"line-chart-overview",category:"vac",col:6,title:"Daily vaccinations comparing with World Line",comparatorIdx:0,xAxisIdx:5,targetIdx:1},{name:"line-chart",category:"vac",col:6,title:"Daily vaccinations comparing with countries population over 100m",xAxisIdx:5,targetIdx:1,filterIdx:1,scaleIdx:0}]},{icon:"map",content:"Geo, Map Chart",id:2,active:!1,charts:[{name:"map-bar-chart",category:"vac",col:12}]}]}},methods:{setSelectorVisible(){this.selectorVisible=!this.selectorVisible},setLoading(i,a){this.charts[i].loading=a},onIntersection(i){const a=this.elements[i.target.dataset.id];a.active=!!i.isIntersecting},toChart(i){document.querySelector(`div[data-id='${i.id}']`).scrollIntoView({behavior:"smooth",block:"center"})},toggleBookmark(i){this.$q.notify({message:"bookmark toggled",color:"secondary"}),this.toggle(i)},...M(N,{toggle:"toggle"})}},X={class:"list"},Y={class:"item"},Z={class:"section"},$={class:"q-my-lg text-h5 text-weight-bold row justify-between","data-id":0},ee=t("span",null,"\u2B07\uFE0F Daily number of confirmed cases rank",-1),te=d("Toogle the the charts to bookmark"),oe={class:"q-my-md row no-wrap q-col-gutter-x-md items-start"},ae={class:"col-8"},se={class:"col-4"},ie=t("span",{class:"text-h6"},"Side Column",-1),ne=t("div",{class:"text-caption"},"Some secondary aid content for novice user.",-1),le={class:"item"},ce={class:"section"},re={class:"q-my-lg text-h5 text-weight-bold row justify-between","data-id":1},de=t("span",null,"\u23F1\uFE0F Daily number of confirmed cases over the timeline",-1),me=d("Toogle the the charts to bookmark"),_e={class:"q-my-md row no-wrap q-col-gutter-x-md items-start"},he={class:"col-6"},ue={class:"col-6"},ge={class:"item"},ve={class:"section"},fe={class:"q-my-lg text-h5 text-weight-bold row justify-between","data-id":2},pe=t("span",null,"\u{1F5FA}\uFE0F Daily number of confirmed cases with geographical perspective",-1),be=d("Toogle the the charts to bookmark"),ke=t("p",{class:"banner-tip"},"\u{1F4A1} Click to scroll to views conveniently.",-1),xe={class:"banner-tip"},we=d("\u{1F4A1} Use "),ye=d(" in header to add charts to explorer section");function Ie(i,a,Ce,Qe,n,c){const w=m("bar-chart"),y=m("line-chart-overview"),I=m("line-chart"),C=m("map-bar-chart"),Q=m("selector");return l(),_(b,null,[e(H,null,{default:o(()=>[e(J,{padding:""},{default:o(()=>[t("div",X,[t("div",Y,[t("div",Z,[r((l(),_("div",$,[ee,r((l(),h(u,{round:"",flat:"",icon:"bookmark",onClick:a[0]||(a[0]=s=>c.toggleBookmark(n.elements[0].charts))},{default:o(()=>[e(v,null,{default:o(()=>[te]),_:1})]),_:1})),[[g]])])),[[p,c.onIntersection]]),t("div",oe,[t("div",ae,[e(w,{color:n.elements[0].charts[0].color,category:"vac",ratio:16/7},null,8,["color"])]),t("div",se,[e(P,null,{default:o(()=>[e(U,null,{default:o(()=>[ie,ne]),_:1})]),_:1})])])])]),e(f,{class:"q-my-xl"}),t("div",le,[t("div",ce,[r((l(),_("div",re,[de,r((l(),h(u,{round:"",flat:"",icon:"bookmark",onClick:a[1]||(a[1]=s=>c.toggleBookmark(n.elements[1].charts))},{default:o(()=>[e(v,null,{default:o(()=>[me]),_:1})]),_:1})),[[g]])])),[[p,c.onIntersection]]),t("div",_e,[t("div",he,[e(y,{title:"Daily new confirmed cases comparing with World Line",category:"vac",comparatorIdx:0,xAxisIdx:5,targetIdx:1})]),t("div",ue,[e(I,{title:"Daily new confirmed cases comparing with countries population over 100m",category:"vac",xAxisIdx:5,targetIdx:1,filterIdx:1,scaleIdx:0})])])])]),e(f,{class:"q-my-xl"}),t("div",ge,[t("div",ve,[r((l(),_("div",fe,[pe,r((l(),h(u,{round:"",flat:"",icon:"bookmark",onClick:a[2]||(a[2]=s=>c.toggleBookmark(n.elements[2].charts))},{default:o(()=>[e(v,null,{default:o(()=>[be]),_:1})]),_:1})),[[g]])])),[[p,c.onIntersection]]),e(C,{category:"vac"})])]),e(f,{class:"q-my-xl"})]),e(T,{position:"bottom-right",offset:[30,30]},{default:o(()=>[e(u,{fab:"",icon:"filter_alt",color:"teal",onClick:c.setSelectorVisible},null,8,["onClick"])]),_:1})]),_:1})]),_:1}),e(R,{modelValue:n.drawer,"onUpdate:modelValue":a[3]||(a[3]=s=>n.drawer=s),"show-if-above":"",width:200,breakpoint:500},{default:o(()=>[e(F,{class:"fit"},{default:o(()=>[e(W,{padding:"",class:"menu-list q-ma-md"},{default:o(()=>[(l(!0),_(b,null,E(n.elements,s=>r((l(),h(z,{active:s.active,focused:s.active,clickable:"",key:s.content,onClick:Ve=>c.toChart(s)},{default:o(()=>[e(x,{avatar:""},{default:o(()=>[e(k,{name:s.icon},null,8,["name"])]),_:2},1024),e(x,null,{default:o(()=>[d(O(s.content),1)]),_:2},1024)]),_:2},1032,["active","focused","onClick"])),[[g]])),128))]),_:1}),e(G,{rounded:"",class:"bg-blue text-white q-ml-md q-mb-md absolute-bottom"},{default:o(()=>[ke,t("p",xe,[we,e(k,{name:"bookmark_border"}),ye])]),_:1})]),_:1})]),_:1},8,["modelValue"]),e(A,{persistent:"",modelValue:n.selectorVisible,"onUpdate:modelValue":a[4]||(a[4]=s=>n.selectorVisible=s)},{default:o(()=>[e(Q)]),_:1},8,["modelValue"])],64)}const Ae=j(K,[["render",Ie]]);export{Ae as default};
