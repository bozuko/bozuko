var async = require('async');
var assert = require('assert');
var mongoose = require('mongoose');
var inspect = require('util').inspect;
var multimeter = require('multimeter');
var charm = require('charm')(process);
var tty = require('tty');

var pages = [{
    city: 'MA - Faneuil Hall',
    lat: 42.360133,
    lng: -71.055767,
    ids: [
        '109610592397958',
        '268434134314',
        '105728236128280',
        '109143555771546',
        '108123539229568',
        '75568770316',
        '152621531418375',
        '149312245095433',
        '117344094964029',
        '140282292684587',
        '102579459803606',
        '120265658025516',
        '145393932150641',
        '121705237878224',
        '136585406382842',
        '110466868990793',
        '115260441868341',
        '145849108780767',
        '116038411757918',
        '111927165505524'
    ]
}, {
    city: 'MA - Back Bay',
    lat: 42.34964,
    lng: -71.082165,
    ids: [
        '124800987569949',
        '165152827649',
        '148560378498199',
        '140209179378877',
        '125860534128664',
        '116900815000348',
        '22508827207',
        '168706466483369',
        '149122355114343',
        '110294802394810',
        '116180175069680',
        '202365499775032',
        '117955551564981',
        '119426118108878',
        '121120414604291',
        '100505133342083',
        '141482275890258',
        '116319218391935',
        '113655315323280',
        '110861058926430'
    ]
},
{
    city: 'MA - Davis Square',
    lat: 42.396476,
    lng: -71.122436,
    ids: [
        '115765841786915',
        '164489203587617',
        '49310988779',
        '145329975502481',
        '371449744466',
        '143469272359987',
        '113731115327377',
        '197147623640778',
        '81810755661',
        '153278041354747',
        '122075817802697',
        '108139895894503',
        '129148010466588',
        '117743048252820',
        '117689721590676',
        '116704485021010',
        '113257972039903',
        '24537581097',
        '110466868990793',
        '153763751300612'
    ]
},
{
    city: 'MA - Hookslides',
    lat: 42.645494,
    lng: -71.307777,
    ids: [
        '147180168638415',
        '104187332979391',
        '111730305528832',
        '111592575545702',
        '117665838259824',
        '113384912027983',
        '121083381236448',
        '147265788631363',
        '196365723046',
        '117384641613788',
        '107226786000718',
        '148281571887154',
        '175025632512675',
        '145755095446946',
        '147872785275809',
        '476577005513',
        '120434094634461',
        '182044405164979',
        '100866566624858',
        '108933965837953'
    ]
},{
    city: 'NYC',
    lat: -74.0063889,
    lng: 40.7141667,
    ids: [
        '172763729438997',
        '111871368829109',
        '105989956098738',
        '62176273988',
        '291705272986',
        '107930359235775',
        '171069902938725',
        '119735988078760',
        '146923231995742',
        '203782706308269',
        '113508278682524',
        '147662241918572',
        '119195981464764',
        '145353295505356',
        '178050658882034',
        '128056040574667',
        '145298522159782',
        '145176182182421',
        '216500111695125',
        '128013370585462',
        '20796366834',
        '121540001228904',
        '126724604042392',
        '12895194491',
        '157740154260025',
        '126937654027317',
        '158337937509743',
        '118138998199144',
        '113989751964989',
        '156433701035240',
        '166119570076493',
        '125541440856370',
        '110548785677656',
        '113403625359462',
        '135244849851799',
        '144942355531139',
        '119549261431306',
        '117609964932068',
        '25980829858',
        '107122189345268',
        '150938814933240',
        '158802974166341',
        '120374841345625',
        '155695484484212',
        '185871941446570',
        '141237149248722',
        '206886296009422',
        '194527580582507',
        '184133134948908',
        '141304062572461',
        '324789822924',
        '203976466293204',
        '150230278375158',
        '168007396550328',
        '185275344821497',
        '131096350295040',
        '126517747424199',
        '151316961608522',
        '156561797740748',
        '183304998363309',
        '151320581551391',
        '231003610243299',
        '112098562186103',
        '142643459110353',
        '103122343061711',
        '111656882203762',
        '117298188289314',
        '109667309113778',
        '47253982956',
        '177871222273740',
        '154679267927037',
        '145790285478073',
        '187974164565213',
        '101678779913734',
        '145702228785572',
        '102543116472224',
        '121797897869151',
        '120251524654002',
        '140613739594',
        '108366905856510',
        '103102986396072',
        '112319308787259',
        '113520482013686',
        '109423129134934',
        '120521687960205',
        '136906589686221',
        '153553334658056',
        '108980342498683',
        '117332188286245',
        '289237964465',
        '109616739074058',
        '157880550903944',
        '6037303508',
        '179989735357962',
        '147595058634884',
        '112566122089416',
        '100885543289555',
        '113545305346235',
        '147175878664048',
        '142981209069781',
        '115908528430588',
        '164814013542099',
        '123682294356645',
        '114109435286390',
        '103702743001923',
        '108165325909057',
        '111695012199832',
        '120357241313658',
        '116605161698148',
        '134998119883164',
        '153123808090574',
        '117204728298474',
        '116291155059105',
        '109570385788725',
        '149949935048372',
        '120314394651690',
        '121312201215569',
        '154899357870167',
        '131587516892795',
        '120417714637392',
        '116141088414420',
        '114450951916484',
        '156070427760993',
        '146815765365733',
        '161459693895716',
        '117862601572556',
        '176312715719711',
        '152367778122461',
        '119645088091701',
        '178742875505865',
        '204437312930690',
        '115709618493902',
        '115251481830619',
        '113824528678773',
        '145063148847588',
        '120161997993958',
        '215616738471258',
        '152764188099364',
        '117553194978786',
        '115565751838528',
        '134705866578162',
        '104113659626451',
        '113415525358657',
        '147261205353691',
        '146137158783029',
        '93089902749',
        '181250725250760',
        '159730310755994',
        '141554135909725',
        '128773207180616',
        '121777551219817',
        '154145557964754',
        '166058630093871',
        '108152895893115',
        '116250805070302',
        '105874619455285',
        '146473905372900',
        '113433952076887',
        '154939947853869',
        '120476181303170',
        '134967539895161',
        '104968739546390',
        '305293451703',
        '120330567984367',
        '113479128686922',
        '137660282942204',
        '7929209986',
        '113430068691281',
        '111756958862057',
        '135489486528374',
        '153054171407962',
        '120829714600284',
        '303573778077',
        '115761468453288',
        '148911201802871',
        '104035822967676',
        '114910341897909',
        '133272053361160',
        '146056108748439',
        '100906546621134',
        '111568628878876',
        '109424745763061',
        '210366169001580',
        '164823823528466',
        '60190688483',
        '147134155345123',
        '140249849343674',
        '59188313563',
        '116308128456334',
        '129202800494826',
        '187922564564958',
        '177889738891251',
        '111807652188259',
        '110576459032450',
        '185619781474601',
        '188398397857068',
        '149087815109885',
        '160926140613482',
        '191386347549654',
        '135935183149766',
        '109708595732501',
        '188292714541462',
        '111728472199643',
        '185842854770617',
        '103080479753270',
        '158283947535295',
        '86455552774',
        '111773205524737',
        '123609464354105',
        '149007281816541',
        '202159879799698',
        '155579561176998',
        '203064236398857',
        '207815469250073',
        '163522336991477',
        '154323807951858',
        '130878203643440',
        '111494662221930',
        '152078181482016',
        '187298251284725',
        '136588579750620',
        '226863527325560',
        '125108198503',
        '101301366596131',
        '115785458443747',
        '245003952197688',
        '167722129905749',
        '155512204492272',
        '103961942986990',
        '97300789829',
        '106581046041612',
        '214115315273547',
        '218691144810925',
        '155450239324',
        '116978681654987',
        '151357501603535',
        '264502356997',
        '227281297283979',
        '69692779090',
        '120480617964179',
        '166764470044674',
        '304036583710',
        '192075814167729',
        '101882613206754',
        '120110318001651',
        '117785008248311',
        '116066668422550',
        '126678697403405',
        '162312647129579',
        '129534893794035',
        '194665857211458',
        '121208024560930',
        '193704890644475',
        '115019595187418',
        '113605055339977',
        '107609478962',
        '173313342708098',
        '177722158912976',
        '301005637839',
        '211323348882266',
        '115644381792151',
        '112245205497797',
        '111782562190912',
        '201247863229880',
        '121196037898173',
        '107462295949770',
        '150066271689512',
        '142533762458727',
        '171447712875037',
        '69372357008',
        '171737479515498',
        '150636384960097',
        '212038705477136',
        '110027792402303',
        '120287554688753',
        '122372287772803',
        '122072591140532',
        '120880314592480',
        '150788674943218',
        '223341671025520',
        '103847913037149',
        '116006938427820',
        '116368415054600',
        '107102910939',
        '122008067809925',
        '157364907623201',
        '153709891309963',
        '157317837643302',
        '121509167862609',
        '158884367497323',
        '108400375904079',
        '140834462619912',
        '138554969487878',
        '129209293818055',
        '24702217619',
        '174545305916129',
        '148128135217025',
        '159034830793600',
        '136048846472530',
        '151986014857265',
        '159244827431480',
        '146468285376331',
        '116157181745335',
        '228700353806713',
        '181155888591062',
        '117702488289736',
        '145878265453658',
        '113359055365593',
        '116020428418482',
        '168582856509253',
        '104899186220280',
        '140703979299207',
        '163779123636581',
        '114002045217',
        '192968627391463',
        '157144944306087',
        '225343210827448',
        '130068187042048',
        '168368186510452',
        '107535092641442',
        '117619811596160',
        '361227080196',
        '71623701248',
        '168641509850145',
        '120417171308900',
        '196758583692795',
        '164884350198194',
        '208579035832610',
        '170160039680116',
        '160645653964404',
        '135520456512361',
        '150607404959198',
        '140126002692610',
        '176505969041740',
        '276911445343',
        '109312202440947',
        '115190111837000',
        '283803265034',
        '78323239989',
        '211352045562932',
        '170278276323567',
        '142427355807936',
        '127869287260079',
        '90119259659',
        '169168279795877',
        '146972421993854',
        '221372721213621',
        '179330678758928',
        '100897039954729',
        '269910422688',
        '180168758671150',
        '127523897322305',
        '232265460121433',
        '501164025149',
        '168182416541374',
        '150850524974588',
        '152454954791071',
        '172722055497',
        '126919424055913',
        '147936298557752',
        '121705117889967',
        '117840618266749',
        '66265028984',
        '164216873624981',
        '153125834719475',
        '205543542795691',
        '174822775880011',
        '132232970154815',
        '153408011351970',
        '157765684236077',
        '181656081844820',
        '113518992013830',
        '119001708114383',
        '206659646031005',
        '159579827429744',
        '111619455540101',
        '203108026368622',
        '185381668167968',
        '164412666931962',
        '114030488629018',
        '254015884624102',
        '117842194909422',
        '174806322539306',
        '120716184609774',
        '212199935463089',
        '138345592873637',
        '192663574093944',
        '198877336805554',
        '104957959547011',
        '116256911735353',
        '159458507432497',
        '191332520877038',
        '181842008504166',
        '155687694448681',
        '162561080451374',
        '60582589039',
        '112017138854278',
        '152728918072661',
        '198692776823847',
        '200723866606991',
        '111286842292126',
        '141274065916238',
        '104511062976523',
        '119701211414469',
        '222867747731209',
        '22085921165',
        '105025952873947',
        '102993846446613',
        '119756804760751',
        '117358734950218',
        '75112100998',
        '113414222026551',
        '105550222810786',
        '127291547348746',
        '172644296108445',
        '111652895539677',
        '142428675797013',
        '121649144511878',
        '199663733381057',
        '171113726233141',
        '111806772189765',
        '129722433756906',
        '120089138069961',
        '119733251377057',
        '142690605769130',
        '125282430861247',
        '120532494630135',
        '132017170202540'
    ]
}, {
    city: 'San Francisco',
    lat: -74.0063889,
    lng: 40.7141667,
    ids: [
        '130112237035457',
        '169055003134620',
        '114586688615991',
        '123451994397463',
        '120636401322293',
        '33568745682',
        '105816349475959',
        '124437477634106',
        '113027475382252',
        '182581205094403',
        '35847162865',
        '193434891255',
        '193494397330919',
        '141153372588000',
        '273471170716',
        '154844627860328',
        '111545582199714',
        '176094032412321',
        '217827494917796',
        '190434857674281',
        '174367325941969',
        '111284918892219',
        '109536332411659',
        '225613520794764',
        '120313674693233',
        '172467169430075',
        '200698463294966',
        '192955250755765',
        '27923251292',
        '148508148504128',
        '178934518824174',
        '103607453036542',
        '151244478226794',
        '170997446278067',
        '103388826370190',
        '86478559426',
        '156503257708636',
        '154660867895530',
        '37586043908',
        '123624310005',
        '129138130472463',
        '138141426237149',
        '228106509574',
        '124837694230462',
        '103395029701525',
        '164465513527',
        '178684718855080',
        '177858703500',
        '41511346282',
        '113010615384822',
        '25446770608',
        '163473573675970',
        '211719195533331',
        '107369352632019',
        '124872950916885',
        '116425448371102',
        '86156050079',
        '129037897173356',
        '164950359467',
        '112684798751094',
        '102499076476728',
        '12161711085',
        '111127775583129',
        '136911916353532',
        '90587139483',
        '107334345989416',
        '145787165455800',
        '152825764759821',
        '266657491639',
        '101690866558804',
        '136058366437925',
        '103412379700660',
        '124531334261075',
        '167198723290269',
        '187533471288030',
        '165091903535473',
        '150174745009009',
        '122783061111952',
        '112624162151253',
        '127319887314107',
        '127924707253103',
        '120134171358709',
        '194390327262114',
        '143844272303519',
        '120718987990947',
        '108886512503018',
        '116016161744266',
        '189947657711707',
        '113913851995162',
        '116364008439586',
        '139425619432243',
        '152879054726355',
        '113121195410182',
        '151192921615753',
        '162809360424976',
        '151013311586386',
        '109504882414733',
        '166489386723786',
        '140365939336362',
        '230596420287961',
        '174022842650317',
        '155846204430946',
        '174477155932900',
        '149142295141640',
        '103364253038919',
        '113399175407465',
        '121118841307303',
        '141680609216288',
        '110131189064959',
        '129403617140793',
        '100551313341044',
        '214000008613014',
        '162854703762818',
        '246700552013832',
        '54097108511',
        '186788058034274',
        '18852284981',
        '143444425716245',
        '154436607903395',
        '218451611524701',
        '100313766713178',
        '142908219066384',
        '146315568732180',
        '141526279220815',
        '169445286421679',
        '166220086743632',
        '47454033607',
        '199771930626',
        '189362347741742',
        '237087445399',
        '159466450764472',
        '111949788832576',
        '156299694393510',
        '112181828805964',
        '182048535172187',
        '107480109287771',
        '122825054440662',
        '147047355341066',
        '157344954286308',
        '112731168746767',
        '135993286454998',
        '155924267760870',
        '219216484768549',
        '111384155618263',
        '372017505223',
        '99295243630',
        '155188997858405',
        '102258676525098',
        '116715371675998',
        '144124912324826',
        '115878451757321',
        '105926546110478',
        '179122288777924',
        '115943878421201',
        '197210123622364',
        '144957615537539',
        '152371488112497',
        '209272132443366',
        '35287628067',
        '14137731226',
        '153401374672150',
        '193002179352',
        '210502215648509',
        '140732219311351',
        '115868435095550',
        '108979049174100',
        '196024987100241',
        '107488842620610',
        '112867758732091',
        '201447373216086',
        '143790165653686',
        '157060520972164',
        '106942499345969',
        '111863232171778',
        '100388633347798',
        '115432971807095',
        '19652732615',
        '165319670171146',
        '115102155173552',
        '230491143645801',
        '135127266516488',
        '210631655648264',
        '236209725584',
        '174871895870681',
        '163145113712513',
        '115753345102283',
        '162396511328',
        '140628585972505',
        '154034284627708',
        '107047696001685',
        '130297110371498',
        '132671630114879',
        '138230826218617',
        '194235190594004',
        '35852090006',
        '213789642001268',
        '361310560046',
        '101574873249984',
        '128752417207190',
        '158724017501360',
        '112805155193',
        '112941098780044',
        '208322862552468',
        '114468775248931',
        '161636240551675',
        '168265383207867',
        '124449440950067',
        '188857041134251',
        '116268281721901',
        '105348962879732',
        '129792780411810',
        '115797905150217',
        '111482035540827',
        '232320296785180',
        '116198348396019',
        '175419099166749',
        '135001666571253',
        '157205031000104',
        '153744921319761',
        '117159518294319',
        '147688168629111',
        '116481235034039',
        '164691925388',
        '111802348840655',
        '206573109380102',
        '155261084534114',
        '131490083570862',
        '120507651356634',
        '31218174573',
        '177642235601969',
        '109148679117680',
        '116115921738876',
        '115639635115623',
        '157306297653812',
        '110347969029247',
        '215361275171158',
        '154934364536024',
        '135609699843377',
        '150896841621043',
        '161535400561447',
        '138088136232339',
        '205714992790220',
        '200613349987770',
        '112859952067187',
        '145949618770142',
        '181626091872956',
        '44427613844',
        '146516572069753',
        '164437990234533',
        '103722649688793',
        '111816925513430',
        '124670840918013',
        '181203031890381',
        '125088697574179',
        '128709440524003',
        '18659287030',
        '109791602386215',
        '115482671801833',
        '112881778772147',
        '203559293003754',
        '176876155685458',
        '116845314995981',
        '169943703029717',
        '152427991482890',
        '107452179291196',
        '149529971762998',
        '55229733041',
        '123105907784134',
        '113135952038870',
        '127763123941652',
        '116383771707440',
        '107038149336241',
        '181931448518450',
        '109390995759085',
        '111794778849407',
        '119955024729429',
        '156935761010755',
        '153134688034734',
        '168957006475664',
        '144907768875970',
        '209000785808625',
        '124085740972978',
        '86666020508',
        '155135871177590',
        '157147437638352',
        '190927814263513',
        '169839223033639',
        '119190904799450',
        '146967415331882',
        '141069729296021',
        '143743408999223',
        '111830962178264',
        '113325085359787',
        '177486845640518',
        '168684453170018',
        '159280460763559',
        '179322185417156',
        '140375722677225',
        '144542158946603',
        '109503065776465',
        '107230565982207',
        '100465710352',
        '151726908212086',
        '153419514668747',
        '110873588977225',
        '111392022216851',
        '18792149822',
        '148071388562108',
        '115799921765438',
        '229732228565',
        '126600797399837',
        '168363233174733',
        '321326147225',
        '154648511271796',
        '46598652052',
        '100847866641953',
        '106655732746990',
        '199539923391955',
        '58802938804',
        '351464190886',
        '146180415412155',
        '231595500191327',
        '181185815238734',
        '181898325176195',
        '169038686461000',
        '115978411751206',
        '106764361374',
        '138047629569916',
        '217434321607764',
        '95766168546',
        '111533162202845',
        '115915318423948',
        '232883346746054',
        '129580120389385',
        '43417482451',
        '149027918119',
        '193729265729',
        '49793039078',
        '182605738429580',
        '109527189105520',
        '176497742398712',
        '107056929334787',
        '99454721322',
        '177891955584342',
        '163166020389664',
        '148135508567230',
        '122066954512309',
        '167854776605052',
        '192913860750214',
        '111148578907944',
        '192028617496825',
        '115463815137082',
        '104987246259897',
        '136108106453031',
        '121657404551376',
        '87619719350',
        '168925256484014',
        '191780784186549',
        '111644412255067',
        '85014617589',
        '155508354496297',
        '163209850384151',
        '148415125169278',
        '201478813206662',
        '116535061695046',
        '109094469124613',
        '55055731107',
        '212706668766278',
        '207745652573969',
        '169175839779057',
        '180759851980703',
        '110136175731750',
        '48411192144',
        '277776360698',
        '192541144105206',
        '68946536813',
        '198588043514822',
        '180102081663',
        '147721491914323',
        '116775665002982',
        '125853557470540',
        '173376596011446',
        '104422186316825',
        '106592896076016',
        '164574766917268',
        '162272260450863',
        '226187637397459',
        '124531754261967',
        '187522207942774',
        '188135090554',
        '112021042160061',
        '113150362036177',
        '118723781534781',
        '101897529862194',
        '203067449730605',
        '112757542076524',
        '108895559144086',
        '111226392233030',
        '69603526888',
        '124710950934317',
        '112134438810383',
        '138948167848',
        '139402626101562',
        '167636009947936',
        '170752802965950',
        '115629541831343',
        '125008294232563',
        '116808181670370',
        '182054011846568',
        '151895824860645',
        '136737073035657',
        '60714091151',
        '124716850908844',
        '132298090153699',
        '157808704241476',
        '165151780198317'
    ]
}];

var page_ids = exports.page_ids = [],
    user_ids = exports.user_ids = [],
    contest_ids = exports.contest_ids = [],
    total_pages = 0,
    user_ct = 0;

pages.forEach(function(page) {
    total_pages += page.ids.length;
});

// Used for progress bars
var multi = multimeter(charm);
var bars = {};

exports.random_city = function() {
    return pages[Math.floor(Math.random()*pages.length)];
};

function setup_progress_bars(options, callback) {
    multi.on('^C', function() {
        multi.destroy();
        charm.cursor(true);
        process.exit();
    });
    charm.reset();
    multi.write('Progress:\n');
    charm.position(function(x, y) {
        var ct = 0;
        ['users', 'pages', 'contests'].forEach(function(name) {
            charm.position(4, y+ct);
            multi.write(name+":");
            bars[name] = multi(name.length+6, y+ct, {width: 30});
            ct++;
        });
        bars.users.ratio(0, options.users);
        bars.pages.ratio(0, total_pages);
        bars.contests.ratio(0, options.contests);
        charm.position(0, y+5);
        charm.cursor(false);
        callback();
    });
}

exports.setup = function(options, callback) {

    user_ct = options.users;
    function create() {
        async.forEachSeries([
            {
                fn: add_users,
                val: options.users
            },{
                fn: add_pages,
                val: pages
            },
            {
                fn:  add_contests,
                val: options
            }],
            function(obj, callback) {
                obj.fn(obj.val, callback);
            },
            function(err) {
                multi.destroy();
                charm.cursor(true);
                callback(err);
            }
        );
    }

    mongoose.connection.on('open', function() {
        setup_progress_bars(options, create);
    });
};

var emptyCollection = function(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){
	    console.log(name+' collection emptied');
	    callback(null, '');
	});
    };
};

function add_pages(pages, callback) {
    var ct = 0;
    async.forEach(pages,
        function(location, cb) {
            return async.forEach(location.ids, function(sid, cb) {
                return Bozuko.service('facebook').place({place_id: sid}, function(err, place) {
                    ct++;
                    bars['pages'].ratio(ct, total_pages);
                    if (err) {
                        // don't stop provisioning. It's probably a moved page id because facebook sucks.
                        return cb();
                    }
                    if (!place) return cb();

                    return Bozuko.models.Page.createFromServiceObject(place, function(err, page) {
                        if (err) return cb(err);
                        if (!page) return cb(new Error("page "+sid+" not created"));
                        page.owner_id = user_ids[Math.floor(Math.random()*user_ct)];
                        page.active = true;
                        return page.save(function(err) {
                            page_ids.push(page._id);
                            return cb(err);
                        });
                    });
                });
                },
                function(err) {
                    return cb(err);
                }
            );
        },
        function(err) {
            return callback(err);
        }
    );
}

function add_contests(options, callback) {
    var ct = 0;
    var page_ct = 0;
    async.until(
        function() { return ct == options.contests; },
        function(cb) {
            var contest = new Bozuko.models.Contest({
                page_id: page_ids[page_ct],
                game: 'slots',
                game_config: {
                    theme: 'default'
                },
                entry_config: [{
                    type: "facebook/checkin",
                    tokens: options.plays_per_entry || 2,
                    // allow unlimited checkins
                    duration: 0
                }],
                start: new Date(),
                end: new Date(2013, 9, 2),
                win_frequency: 2,
                free_play_pct: options.free_play_pct || 10
            });
            contest.prizes.push({
                name: 'Best Prize Ever',
                value: '10',
                description: "Can\'t tell you what it is",
                details: "You Wish",
                duration: 600000,
                instructions: "Figure it out and use it",
                total: options.prizes || 200
            });
            contest.save(function(err) {
                if (err) {
                    return callback(err);
                }
                contest_ids.push(contest._id);
                contest.publish(function(err) {
                    if (err) {
                        return callback(err);
                    }
                    ct++;
                    bars['contests'].ratio(ct, options.contests);
                    if (page_ct === page_ids.length - 1) {
                        page_ct = 0;
                    } else {
                        page_ct++;
                    }
                    return cb(err);
                });
            });
        },
        function(err) {
            callback(err);
        }
    );
}

function add_users(count, callback) {
    var ct = 0;
    async.until(
        function() { return ct === count; },
        function(cb) {

            var u = new Bozuko.models.User();
            u.name = 'user '+ct;
            u.first_name = 'user';
            u.last_name =  ''+ct;
            u.email = 'user@'+ct+'.com';
            u.token = ''+ct;
            u.challenge = ct;
            u.image = "http://graph.facebook.com/557924168/picture?type=large";
            u.gender = 'trans';
            u.phones = [{
                type: 'iphone',
                unique_id:''+ct
            }];

            u.service('facebook', ''+ct, u.token, "somedata");
            u.service('facebook').internal = {likes:[], friends:[], friend_count: 0};

            return u.save(function(err) {
                if (err) return cb(err);
                user_ids.push(u._id);
                ct++;
                bars['users'].ratio(ct, count);
                cb();
            });

        },
        function(err) {
            callback(err);
        }
    );
}
