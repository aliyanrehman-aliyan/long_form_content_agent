ALTER ROLE authenticator SET pgrst.db_schemas =
  'public, storage, graphql_public, ag_front_desk_concierge_dev, ag_front_desk_concierge_test, ag_front_desk_concierge, nexatoris_dev, nexatoris_test, nexatoris, ag_social_media_content, ag_claims_review, ag_long_form_content, ag_long_form_content_dev, ag_long_form_content_test';

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
