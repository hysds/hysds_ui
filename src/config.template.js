// configuration file

// local or AWS managed ElasticSearch instance
exports.GRQ_ES_URL = 'http://localhost:9200';

// comma separated indices (ex. idx1,idx2,idx3,...)
// _all so we search on all indices
exports.GRQ_ES_INDICES = '_all';

// not sure if we need this
exports.REACTIVEBASE_CREDENTIALS = 'nY6NNTZZ6:27b76b9f-18ea-456c-bc5e-3a5263ebc63d';

// all leaflet styles: https://leaflet-extras.github.io/leaflet-providers/preview/
// exports.LEAFLET_TILELAYER = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
// exports.LEAFLET_ATTRIBUTION = '&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors';
exports.LEAFLET_TILELAYER = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png';
exports.LEAFLET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// API endpoints to get the available actions for on-demand
exports.TOSCA_API_BASE = 'http://localhost:5000'; // base url for TOSCA API
// exports.TOSCA_API_BASE = 'http://c-datasets.aria.hysds.io:8878/api/v0.1/';
exports.TOSCA_ACTIONS_API = 'user_rules/get_jobspec_names';
// exports.TOSCA_ACTIONS_API = 'hysds_io/list';
exports.QUEUE_LIST_API = 'queue/list';

exports.QUEUE_PRIORITIES = [
  { value: 0, label: 0 },
  { value: 1, label: 1 },
  { value: 2, label: 2 },
  { value: 3, label: 3 },
  { value: 4, label: 4 },
  { value: 5, label: 5 },
  { value: 6, label: 6 },
  { value: 7, label: 7 },
  { value: 8, label: 8 },
  { value: 9, label: 9 }
];

// test dropdown values
exports.JOBS = [
  { value: "hysds-io-acquisition_localizer_multi:master", label: "hysds-io-acquisition_localizer_multi:master" },
  { value: "hysds-io-acquisition_localizer_multi:release-20190405", label: "hysds-io-acquisition_localizer_multi:release-20190405" },
  { value: "hysds-io-acquisition_localizer:dev", label: "hysds-io-acquisition_localizer:dev" },
  { value: "hysds-io-aoi_acquisition_localizer:dev", label: "hysds-io-aoi_acquisition_localizer:dev" },
  { value: "hysds-io-add_machine_tag:master", label: "hysds-io-add_machine_tag:master" },
  { value: "hysds-io-add_tag:master", label: "hysds-io-add_tag:master" },
  { value: "hysds-io-AOI_based_ipf_submitter:release-20190404", label: "hysds-io-AOI_based_ipf_submitter:release-20190404" },
  { value: "hysds-io-enumerator_submitter:master", label: "hysds-io-enumerator_submitter:master" },
  { value: "hysds-io-enumerator_submitter:release-20190314", label: "hysds-io-enumerator_submitter:release-20190314" },
  { value: "hysds-io-enumerator_submitter:release-20190402", label: "hysds-io-enumerator_submitter:release-20190402" },
  { value: "hysds-io-aoi_validate_acquisitions:release-20190404", label: "hysds-io-aoi_validate_acquisitions:release-20190404" },
  { value: "hysds-io-lw-tosca-aws_get:v0.0.5", label: "hysds-io-lw-tosca-aws_get:v0.0.5" },
  { value: "hysds-io-check_aoi_expiration:master", label: "hysds-io-check_aoi_expiration:master" },
  { value: "hysds-io-create_aoi:master", label: "hysds-io-create_aoi:master" },
  { value: "hysds-io-spyddder-extract:standard-product", label: "hysds-io-spyddder-extract:standard-product" },
  { value: "hysds-io-spyddder-sling-extract:dev", label: "hysds-io-spyddder-sling-extract:dev" },
  { value: "hysds-io-spyddder-sling-extract-asf:develop", label: "hysds-io-spyddder-sling-extract-asf:develop" },
  { value: "hysds-io-spyddder-sling-extract-asf:release-dev-20190405", label: "hysds-io-spyddder-sling-extract-asf:release-dev-20190405" },
  { value: "hysds-io-spyddder-sling-extract-scihub:develop", label: "hysds-io-spyddder-sling-extract-scihub:develop" },
  { value: "hysds-io-spyddder-sling-extract-scihub:release-dev-20190405", label: "hysds-io-spyddder-sling-extract-scihub:release-dev-20190405" },
  { value: "hysds-io-lightweight-echo:v0.0.5", label: "hysds-io-lightweight-echo:v0.0.5" },
  { value: "hysds-io-acquisition_ingest-scihub:release-20190404", label: "hysds-io-acquisition_ingest-scihub:release-20190404" },
  { value: "hysds-io-bos_ingest:master", label: "hysds-io-bos_ingest:master" },
  { value: "hysds-io-acquisition_ingest-bos:master", label: "hysds-io-acquisition_ingest-bos:master" },
  { value: "hysds-io-sciflo-ifg-stitcher:develop", label: "hysds-io-sciflo-ifg-stitcher:develop" },
  { value: "hysds-io-sciflo-ifg-stitcher:release-dev-20190405", label: "hysds-io-sciflo-ifg-stitcher:release-dev-20190405" },
  { value: "hysds-io-ipf-scraper-asf:release-20190404", label: "hysds-io-ipf-scraper-asf:release-20190404" },
  { value: "hysds-io-ipf-scraper-scihub:release-20190404", label: "hysds-io-ipf-scraper-scihub:release-20190404" },
  { value: "hysds-io-ml-feature-extractor:develop", label: "hysds-io-ml-feature-extractor:develop" },
  { value: "hysds-io-ml-feature-extractor:release-dev-20190405", label: "hysds-io-ml-feature-extractor:release-dev-20190405" },
  { value: "hysds-io-ml-feature-extractor:standard-product", label: "hysds-io-ml-feature-extractor:standard-product" },
  { value: "hysds-io-ml-predictor:develop", label: "hysds-io-ml-predictor:develop" },
  { value: "hysds-io-ml-predictor:release-dev-20190405", label: "hysds-io-ml-predictor:release-dev-20190405" },
  { value: "hysds-io-ml-predictor:standard-product", label: "hysds-io-ml-predictor:standard-product" },
  { value: "hysds-io-lw-tosca-notify-by-email:v0.0.5", label: "hysds-io-lw-tosca-notify-by-email:v0.0.5" },
  { value: "hysds-io-product-delivery:develop", label: "hysds-io-product-delivery:develop" },
  { value: "hysds-io-lw-tosca-purge:v0.0.5", label: "hysds-io-lw-tosca-purge:v0.0.5" },
  { value: "hysds-io-reprocess-s1-ifg:develop", label: "hysds-io-reprocess-s1-ifg:develop" },
  { value: "hysds-io-reprocess-s1-ifg:release-dev-20190405", label: "hysds-io-reprocess-s1-ifg:release-dev-20190405" },
  { value: "hysds-io-reprocess-s1-ifg:standard-product", label: "hysds-io-reprocess-s1-ifg:standard-product" },
  { value: "hysds-io-s1-cor:develop", label: "hysds-io-s1-cor:develop" },
  { value: "hysds-io-s1-cor:release-dev-20190405", label: "hysds-io-s1-cor:release-dev-20190405" },
  { value: "hysds-io-s1-cor:standard-product", label: "hysds-io-s1-cor:standard-product" },
  { value: "hysds-io-s1-lar:develop", label: "hysds-io-s1-lar:develop" },
  { value: "hysds-io-s1-lar:release-dev-20190405", label: "hysds-io-s1-lar:release-dev-20190405" },
  { value: "hysds-io-s1-lar:standard-product", label: "hysds-io-s1-lar:standard-product" },
  { value: "hysds-io-time-series_stitched:develop", label: "hysds-io-time-series_stitched:develop" },
  { value: "hysds-io-time-series_stitched:release-dev-20190405", label: "hysds-io-time-series_stitched:release-dev-20190405" },
  { value: "hysds-io-time-series_stitched:standard-product", label: "hysds-io-time-series_stitched:standard-product" },
  { value: "hysds-io-time-series:develop", label: "hysds-io-time-series:develop" },
  { value: "hysds-io-time-series:release-dev-20190405", label: "hysds-io-time-series:release-dev-20190405" },
  { value: "hysds-io-time-series:standard-product", label: "hysds-io-time-series:standard-product" },
  { value: "hysds-io-scrub_outdated_bos_acqs:master", label: "hysds-io-scrub_outdated_bos_acqs:master" },
  { value: "hysds-io-s1_calibration_crawler:master", label: "hysds-io-s1_calibration_crawler:master" },
  { value: "hysds-io-s1_calibration_crawler:release-20190313", label: "hysds-io-s1_calibration_crawler:release-20190313" },
  { value: "hysds-io-sciflo-dense_offset:develop", label: "hysds-io-sciflo-dense_offset:develop" },
  { value: "hysds-io-sciflo-dense_offset:release-dev-20190405", label: "hysds-io-sciflo-dense_offset:release-dev-20190405" },
  { value: "hysds-io-sciflo-dense_offset:standard-product", label: "hysds-io-sciflo-dense_offset:standard-product" },
  { value: "hysds-io-audit-ifg:develop", label: "hysds-io-audit-ifg:develop" },
  { value: "hysds-io-audit-ifg:release-dev-20190405", label: "hysds-io-audit-ifg:release-dev-20190405" },
  { value: "hysds-io-audit-ifg:standard-product", label: "hysds-io-audit-ifg:standard-product" },
  { value: "hysds-io-sciflo-s1-ifg:develop", label: "hysds-io-sciflo-s1-ifg:develop" },
  { value: "hysds-io-sciflo-s1-ifg:release-dev-20190405", label: "hysds-io-sciflo-s1-ifg:release-dev-20190405" },
  { value: "hysds-io-sciflo-s1-ifg:standard-product", label: "hysds-io-sciflo-s1-ifg:standard-product" },
  { value: "hysds-io-s1-validate-ifg:develop", label: "hysds-io-s1-validate-ifg:develop" },
  { value: "hysds-io-s1-validate-ifg:release-dev-20190405", label: "hysds-io-s1-validate-ifg:release-dev-20190405" },
  { value: "hysds-io-s1-validate-ifg:standard-product", label: "hysds-io-s1-validate-ifg:standard-product" },
  { value: "hysds-io-sciflo-s1-slcp-mrpe:develop", label: "hysds-io-sciflo-s1-slcp-mrpe:develop" },
  { value: "hysds-io-sciflo-s1-slcp-mrpe:release-dev-20190405", label: "hysds-io-sciflo-s1-slcp-mrpe:release-dev-20190405" },
  { value: "hysds-io-sciflo-s1-slcp-mrpe:standard-product", label: "hysds-io-sciflo-s1-slcp-mrpe:standard-product" },
  { value: "hysds-io-s1_orbit_crawler:master", label: "hysds-io-s1_orbit_crawler:master" },
  { value: "hysds-io-s1_orbit_crawler:release-20190313", label: "hysds-io-s1_orbit_crawler:release-20190313" },
  { value: "hysds-io-s1_orbit_ingest:master", label: "hysds-io-s1_orbit_ingest:master" },
  { value: "hysds-io-s1_orbit_ingest:release-20190313", label: "hysds-io-s1_orbit_ingest:release-20190313" },
  { value: "hysds-io-sciflo-s1-slcp:develop", label: "hysds-io-sciflo-s1-slcp:develop" },
  { value: "hysds-io-sciflo-s1-slcp:release-dev-20190405", label: "hysds-io-sciflo-s1-slcp:release-dev-20190405" },
  { value: "hysds-io-sciflo-s1-slcp:standard-product", label: "hysds-io-sciflo-s1-slcp:standard-product" },
  { value: "hysds-io-audit-slcp:develop", label: "hysds-io-audit-slcp:develop" },
  { value: "hysds-io-audit-slcp:release-dev-20190405", label: "hysds-io-audit-slcp:release-dev-20190405" },
  { value: "hysds-io-audit-slcp:standard-product", label: "hysds-io-audit-slcp:standard-product" },
  { value: "hysds-io-s1-validate-ts:develop", label: "hysds-io-s1-validate-ts:develop" },
  { value: "hysds-io-s1-validate-ts:release-dev-20190405", label: "hysds-io-s1-validate-ts:release-dev-20190405" },
  { value: "hysds-io-s1-validate-ts:standard-product", label: "hysds-io-s1-validate-ts:standard-product" },
  { value: "hysds-io-slc_sideloader:master", label: "hysds-io-slc_sideloader:master" },
  { value: "hysds-io-sling:dev", label: "hysds-io-sling:dev" },
  { value: "hysds-io-sling-oauth:dev", label: "hysds-io-sling-oauth:dev" },
  { value: "hysds-io-standard_product-s1gunw-acqlist_evaluator_ifgcfg:master", label: "hysds-io-standard_product-s1gunw-acqlist_evaluator_ifgcfg:master" },
  { value: "hysds-io-standard_product-s1gunw-acqlist_evaluator_ifgcfg:release-20190405", label: "hysds-io-standard_product-s1gunw-acqlist_evaluator_ifgcfg:release-20190405" },
  { value: "hysds-io-aoi_enumeration_report:master", label: "hysds-io-aoi_enumeration_report:master" },
  { value: "hysds-io-aoi_enumeration_report:release-20190405", label: "hysds-io-aoi_enumeration_report:release-20190405" },
  { value: "hysds-io-standard_product_report:master", label: "hysds-io-standard_product_report:master" },
  { value: "hysds-io-standard_product_report:release-20190405", label: "hysds-io-standard_product_report:release-20190405" },
  { value: "hysds-io-standard_product_aoi_completeness_evaluator:master", label: "hysds-io-standard_product_aoi_completeness_evaluator:master" },
  { value: "hysds-io-standard_product-s1gunw-acq_enumerator:master", label: "hysds-io-standard_product-s1gunw-acq_enumerator:master" },
  { value: "hysds-io-standard_product-s1gunw-acq_enumerator:release-20190405", label: "hysds-io-standard_product-s1gunw-acq_enumerator:release-20190405" },
  { value: "hysds-io-standard_product_validator:master", label: "hysds-io-standard_product_validator:master" },
  { value: "hysds-io-standard_product_tagger:master", label: "hysds-io-standard_product_tagger:master" },
  { value: "hysds-io-standard_product_s1_gunw_completeness_evaluator:master", label: "hysds-io-standard_product_s1_gunw_completeness_evaluator:master" },
  { value: "hysds-io-standard_product-s1gunw-slc_localizer:master", label: "hysds-io-standard_product-s1gunw-slc_localizer:master" },
  { value: "hysds-io-standard_product-s1gunw-slc_localizer:release-20190405", label: "hysds-io-standard_product-s1gunw-slc_localizer:release-20190405" },
  { value: "hysds-io-standard_product-s1gunw-topsapp:standard-product", label: "hysds-io-standard_product-s1gunw-topsapp:standard-product" },
  { value: "hysds-io-sciflo-ifg-stitcher:standard-product", label: "hysds-io-sciflo-ifg-stitcher:standard-product" },
  { value: "hysds-io-sciflo-standard-product-ifg:standard-product", label: "hysds-io-sciflo-standard-product-ifg:standard-product" },
  { value: "hysds-io-sciflo-topsapp-ifg:develop", label: "hysds-io-sciflo-topsapp-ifg:develop" },
  { value: "hysds-io-sciflo-topsapp-ifg:release-dev-20190405", label: "hysds-io-sciflo-topsapp-ifg:release-dev-20190405" },
  { value: "hysds-io-sciflo-topsapp-ifg:standard-product", label: "hysds-io-sciflo-topsapp-ifg:standard-product" },
  { value: "hysds-io-sciflo-topsapp-slcp:develop", label: "hysds-io-sciflo-topsapp-slcp:develop" },
  { value: "hysds-io-sciflo-topsapp-slcp:release-dev-20190405", label: "hysds-io-sciflo-topsapp-slcp:release-dev-20190405" },
  { value: "hysds-io-sciflo-topsapp-slcp:standard-product", label: "hysds-io-sciflo-topsapp-slcp:standard-product" },
  { value: "hysds-io-update_time:master", label: "hysds-io-update_time:master" },
  { value: "hysds-io-update_track:master", label: "hysds-io-update_track:master" },
  { value: "hysds-io-cmr_ingest_update:master", label: "hysds-io-cmr_ingest_update:master" },
  { value: "hysds-io-sciflo-validated-stitcher:develop", label: "hysds-io-sciflo-validated-stitcher:develop" },
  { value: "hysds-io-sciflo-validated-stitcher:release-dev-20190405", label: "hysds-io-sciflo-validated-stitcher:release-dev-20190405" },
  { value: "hysds-io-lw-tosca-wget:v0.0.5", label: "hysds-io-lw-tosca-wget:v0.0.5" },
  { value: "hysds-io-lw-tosca-wget-email:v0.0.5", label: "hysds-io-lw-tosca-wget-email:v0.0.5" },
  { value: "hysds-io-lw-tosca-wget-product:v0.0.5", label: "hysds-io-lw-tosca-wget-product:v0.0.5"}
];

exports.QUEUES = [
  { value: "system-jobs-queue", label: "system-jobs-queue" },
  { value: "acquisition-scraper-asf", label: "acquisition-scraper-asf" },
  { value: "acquisition-scraper-scihub", label: "acquisition-scraper-scihub" },
  { value: "apihub_scraper_throttled", label: "apihub_scraper_throttled" },
  { value: "asf-job_worker-large", label: "asf-job_worker-large" },
  { value: "factotum-create_aoi-queue", label: "factotum-create_aoi-queue" },
  { value: "factotum-job_worker-apihub_scraper_throttled", label: "factotum-job_worker-apihub_scraper_throttled" },
  { value: "factotum-job_worker-apihub_throttled", label: "factotum-job_worker-apihub_throttled" },
  { value: "factotum-job_worker-asf_throttled", label: "factotum-job_worker-asf_throttled" },
  { value: "factotum-job_worker-large", label: "factotum-job_worker-large" },
  { value: "factotum-job_worker-realtime", label: "factotum-job_worker-realtime" },
  { value: "factotum-job_worker-scihub_throttled", label: "factotum-job_worker-scihub_throttled" },
  { value: "factotum-job_worker-small", label: "factotum-job_worker-small" },
  { value: "factotum-job_worker-unavco_throttled", label: "factotum-job_worker-unavco_throttled" },
  { value: "ipf-scraper-asf", label: "ipf-scraper-asf" },
  { value: "ipf-scraper-scihub", label: "ipf-scraper-scihub" },
  { value: "spyddder-sling-extract-asf", label: "spyddder-sling-extract-asf" },
  { value: "spyddder-sling-extract-scihub", label: "spyddder-sling-extract-scihub" },
  { value: "standard_product-s1gunw-acq_enumerator", label: "standard_product-s1gunw-acq_enumerator" },
  { value: "standard_product-s1gunw-acqlist_evaluator_ifgcfg", label: "standard_product-s1gunw-acqlist_evaluator_ifgcfg" },
  { value: "standard_product-s1gunw-slc_localizer", label: "standard_product-s1gunw-slc_localizer" },
  { value: "standard_product-s1gunw-topsapp", label: "standard_product-s1gunw-topsapp" },
  { value: "system-jobs-queue", label: "system-jobs-queue" }
];
