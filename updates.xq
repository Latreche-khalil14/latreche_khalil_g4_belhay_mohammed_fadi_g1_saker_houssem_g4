import module namespace update = "http://basex.org/modules/update";
declare variable $newCoefficient as xs:decimal := 2.0;

insert node
  <membre id="M017" categorieRef="C4">
    <nom>Zerrouk</nom>
    <prenom>Lyna</prenom>
    <email>l.zerrouk@club.dz</email>
  </membre>
into doc("club.xml")//membres

,

update:output(
  <avantModification>
    { doc("club.xml")//concours[@id="CO2"]/@coefficient }
  </avantModification>
)

,

replace value of node doc("club.xml")//concours[@id="CO2"]/@coefficient
with $newCoefficient

,

update:output(
  <apresModification coefficient="{$newCoefficient}"/>
)

,

delete node doc("club.xml")//concours[@id="CO2"]//participant[@membreRef="M008"]
