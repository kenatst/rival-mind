-- ==============================================================================
-- IQ ARENA - SQL Seed: Initial Verified Knowledge & Question Bank
-- ==============================================================================

do $$
declare
    v_src_id uuid;
    v_entity_id uuid;
    v_fact_id uuid;
    v_cat_geo uuid;
    v_cat_hist uuid;
    v_cat_sci uuid;
    v_cat_spo uuid;
    v_cat_cin uuid;
    v_cat_mus uuid;
    v_cat_art uuid;
    v_cat_lit uuid;
    v_cat_tech uuid;
    v_cat_nat uuid;
    v_cat_soc uuid;
    v_cat_food uuid;

    v_concept_id uuid;
    v_variant_id uuid;
begin
    -- 1. Create Knowledge Source
    insert into public.knowledge_sources (name, base_url, license, source_type, trust_score)
    values ('IQ Arena Official Knowledge Registry', 'https://iqarena.gg/knowledge', 'CC-BY-SA-4.0', 'curated', 1.00)
    returning id into v_src_id;

    -- Fetch categories
    select id into v_cat_geo from public.categories where slug = 'geography';
    select id into v_cat_hist from public.categories where slug = 'history';
    select id into v_cat_sci from public.categories where slug = 'science';
    select id into v_cat_spo from public.categories where slug = 'sports';
    select id into v_cat_cin from public.categories where slug = 'cinema';
    select id into v_cat_mus from public.categories where slug = 'music';
    select id into v_cat_art from public.categories where slug = 'art';
    select id into v_cat_lit from public.categories where slug = 'literature';
    select id into v_cat_tech from public.categories where slug = 'technology';
    select id into v_cat_nat from public.categories where slug = 'nature';
    select id into v_cat_soc from public.categories where slug = 'society';
    select id into v_cat_food from public.categories where slug = 'food';

    -- Q1: Canada Coastline
    insert into public.knowledge_entities (canonical_name, entity_type) values ('Canada', 'Country') returning id into v_entity_id;
    insert into public.knowledge_facts (subject_entity_id, predicate, text_value, source_id)
    values (v_entity_id, 'has_longest_coastline', '202,080 km', v_src_id) returning id into v_fact_id;

    insert into public.question_concepts (primary_fact_id, category_id, difficulty_estimate)
    values (v_fact_id, v_cat_geo, 'easy') returning id into v_concept_id;

    insert into public.question_variants (concept_id, language_code, prompt, explanation, difficulty_estimate, quality_score, review_status, active)
    values (v_concept_id, 'fr', 'Quel pays au monde possède le plus long littoral côtier total ?', 'Le Canada possède plus de 202 080 km de côtes.', 'easy', 0.98, 'approved', true)
    returning id into v_variant_id;

    insert into public.question_options (question_variant_id, option_text, is_correct, position) values
        (v_variant_id, 'Canada', true, 1),
        (v_variant_id, 'Russie', false, 2),
        (v_variant_id, 'Indonésie', false, 3),
        (v_variant_id, 'Australie', false, 4);

    -- Q2: Machu Picchu
    insert into public.knowledge_entities (canonical_name, entity_type) values ('Machu Picchu', 'Citadel') returning id into v_entity_id;
    insert into public.knowledge_facts (subject_entity_id, predicate, text_value, source_id)
    values (v_entity_id, 'built_by_empire', 'Inca Empire', v_src_id) returning id into v_fact_id;

    insert into public.question_concepts (primary_fact_id, category_id, difficulty_estimate)
    values (v_fact_id, v_cat_hist, 'easy') returning id into v_concept_id;

    insert into public.question_variants (concept_id, language_code, prompt, explanation, difficulty_estimate, quality_score, review_status, active)
    values (v_concept_id, 'fr', 'Quelle civilisation précolombienne a érigé la citadelle sacrée du Machu Picchu ?', 'Le Machu Picchu a été construit par l''Empire Inca vers 1450 sous l''empereur Pachacuti.', 'easy', 0.99, 'approved', true)
    returning id into v_variant_id;

    insert into public.question_options (question_variant_id, option_text, is_correct, position) values
        (v_variant_id, 'Empire Inca', true, 1),
        (v_variant_id, 'Empire Aztèque', false, 2),
        (v_variant_id, 'Civilisation Maya', false, 3),
        (v_variant_id, 'Civilisation Olmèque', false, 4);

    -- Q3: Tungsten
    insert into public.knowledge_entities (canonical_name, entity_type) values ('Tungsten', 'Chemical Element') returning id into v_entity_id;
    insert into public.knowledge_facts (subject_entity_id, predicate, text_value, source_id)
    values (v_entity_id, 'periodic_symbol', 'W', v_src_id) returning id into v_fact_id;

    insert into public.question_concepts (primary_fact_id, category_id, difficulty_estimate)
    values (v_fact_id, v_cat_sci, 'medium') returning id into v_concept_id;

    insert into public.question_variants (concept_id, language_code, prompt, explanation, difficulty_estimate, quality_score, review_status, active)
    values (v_concept_id, 'fr', 'Quel élément chimique du tableau périodique est représenté par le symbole W ?', 'Le symbole W vient du nom allemand Wolfram, possédant le point de fusion le plus élevé (3 422°C).', 'medium', 0.96, 'approved', true)
    returning id into v_variant_id;

    insert into public.question_options (question_variant_id, option_text, is_correct, position) values
        (v_variant_id, 'Tungstène', true, 1),
        (v_variant_id, 'Étain', false, 2),
        (v_variant_id, 'Uranium', false, 3),
        (v_variant_id, 'Zirconium', false, 4);

end $$;
