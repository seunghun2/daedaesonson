const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbyrfmgndbxnlkruktvy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieXJmbWduZGJ4bmxrcnVrdHZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjg0MjAxNCwiZXhwIjoyMDQyNDE4MDE0fQ.LMAvnCFCzah84NmxYIkl0SBdrkELy7UCa4voMjNqfHQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facilities.json'), 'utf8'));

    const ids = ['park-0533', 'park-0538'];
    let success = 0;

    for (const id of ids) {
        const park = data.find(x => x.id === id);
        if (!park) continue;

        const { error } = await supabase
            .from('facilities')
            .update({ price_info: park.priceInfo })
            .eq('id', id);

        if (error) {
            console.error('❌ ' + id + ': ' + error.message);
        } else {
            console.log('✅ ' + id + ' ' + park.name + ' → DB 동기화 완료');
            success++;
        }
    }

    console.log('\n📊 결과: ' + success + '/' + ids.length + '개 동기화 완료');
}

sync();
